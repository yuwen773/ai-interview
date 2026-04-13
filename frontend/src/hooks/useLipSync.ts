/**
 * useLipSync - 唇形同步 Hook
 *
 * 使用 AnalyserNode 分析音频频率，驱动嘴型动画。
 * 与 useQuestionVoicePlayer 共享 AudioContext：
 * - useQuestionVoicePlayer 调用 setAudioContext 注入 ctx
 * - useQuestionVoicePlayer 播放时调用 _analyzeSource 建立分析链路
 *
 * 音频图（不影响 playAudioBuffer 的 source→destination）：
 *   source → analyser → gain(0) → destination
 * 其中 gain(0) 让 analyser 进入音频图（才能 getByteFrequencyData），
 * 但静音输出，避免与 playAudioBuffer 的直接连接叠加导致音量翻倍。
 */
import { useCallback, useRef, useState } from 'react';

interface UseLipSyncReturn {
  /** 当前嘴型开度 (0-1) */
  mouthOpen: number;
  /** 注入 AudioContext，建立 AnalyserNode */
  setAudioContext: (ctx: AudioContext) => void;
  /** 断开连接，停止分析 */
  clearAudioContext: () => void;
}

export function useLipSync(): UseLipSyncReturn & {
  /** 播放器播放时调用，连接 AudioBufferSourceNode 到分析链路 */
  _analyzeSource: (source: AudioBufferSourceNode) => void;
} {
  const [mouthOpen, setMouthOpen] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (activeSourceRef.current) {
      try { activeSourceRef.current.disconnect(analyserRef.current!); } catch (_) {}
      activeSourceRef.current = null;
    }
    setMouthOpen(0);
    prevValueRef.current = 0;
  }, []);

  const clearAudioContext = useCallback(() => {
    stopAnalysis();
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (_) {}
      analyserRef.current = null;
    }
    if (silentGainRef.current) {
      try { silentGainRef.current.disconnect(); } catch (_) {}
      silentGainRef.current = null;
    }
    audioCtxRef.current = null;
  }, [stopAnalysis]);

  const setAudioContext = useCallback((ctx: AudioContext) => {
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (_) {}
    }
    if (silentGainRef.current) {
      try { silentGainRef.current.disconnect(); } catch (_) {}
    }
    stopAnalysis();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    // smoothingTimeConstant 越小，响应越灵敏
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;

    // 静音 GainNode：让 analyser 进入图，但不输出声音（避免叠加）
    const silent = ctx.createGain();
    silent.gain.value = 0;
    analyser.connect(silent);
    silent.connect(ctx.destination);
    silentGainRef.current = silent;
  }, [stopAnalysis]);

  /** 播放开始时调用：将 AudioBufferSourceNode 接入分析链路 */
  const analyzeSource = useCallback((source: AudioBufferSourceNode) => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    // 断开旧源（只断开到 analyser 的连接，不影响它到 destination 的连接）
    if (activeSourceRef.current) {
      try { activeSourceRef.current.disconnect(analyser); } catch (_) {}
    }

    // source → analyser（analyser 已通过 gain(0) 连接到 destination）
    source.connect(analyser);
    activeSourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      // 非线性映射：让低音量时嘴型动画仍然可见
      const norm = Math.pow(avg / 100, 0.7);
      // 响应速度：开口快(0.3旧+0.7新)，闭口慢(0.7旧+0.3新)
      const prev = prevValueRef.current;
      const smoothed = norm > prev
        ? prev * 0.3 + norm * 0.7
        : prev * 0.7 + norm * 0.3;
      const clamped = Math.min(Math.max(smoothed, 0), 1);
      if (Math.abs(clamped - prev) > 0.005) {
        setMouthOpen(clamped);
      }
      prevValueRef.current = clamped;
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  return {
    mouthOpen,
    setAudioContext,
    clearAudioContext,
    _analyzeSource: analyzeSource,
  };
}
