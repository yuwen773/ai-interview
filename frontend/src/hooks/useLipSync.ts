/**
 * useLipSync - 唇形同步 Hook
 *
 * 使用 AnalyserNode 分析音频频率，驱动嘴型动画。
 * 与 useQuestionVoicePlayer 共享 AudioContext：
 * - useQuestionVoicePlayer 调用 setAudioContext 注入 ctx
 * - useQuestionVoicePlayer 播放时调用 analyzeSource 建立分析链路
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
      try { activeSourceRef.current.disconnect(); } catch (_) {}
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
    audioCtxRef.current = null;
  }, [stopAnalysis]);

  const setAudioContext = useCallback((ctx: AudioContext) => {
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch (_) {}
    }
    stopAnalysis();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
  }, [stopAnalysis]);

  /** 播放开始时调用：将 AudioBufferSourceNode 接入分析链路 */
  const analyzeSource = useCallback((source: AudioBufferSourceNode) => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return;

    if (activeSourceRef.current) {
      try { activeSourceRef.current.disconnect(); } catch (_) {}
    }

    // 源 → 分析器 → 目的地（播放 + 分析同时进行）
    source.connect(analyser);
    analyser.connect(ctx.destination);
    activeSourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const norm = Math.pow(avg / 128, 0.8);
      const smoothed = prevValueRef.current * 0.6 + norm * 0.4;
      if (Math.abs(smoothed - prevValueRef.current) > 0.01) {
        setMouthOpen(smoothed);
      }
      prevValueRef.current = smoothed;
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
