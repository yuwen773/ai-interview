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

    // 辅助数组（避免每帧分配）
  const timeDataRef = { current: new Uint8Array(0) };

  const tick = () => {
      if (!analyserRef.current) return;
      const analyser = analyserRef.current;
      const freqData = dataArray;
      analyser.getByteFrequencyData(freqData);

      // --- 改进1: 聚焦语音频率范围 (300Hz~3kHz) ---
      // fftSize=256 → bin宽 ≈ sampleRate/256 ≈ 172Hz
      // bin[2] ≈ 344Hz, bin[17] ≈ 2924Hz, 取 2~17 (共16个bin)
      const SPEECH_BIN_START = 2;
      const SPEECH_BIN_END = 17;
      let speechSum = 0;
      let speechCount = 0;
      for (let i = SPEECH_BIN_START; i <= SPEECH_BIN_END && i < bufferLength; i++) {
        speechSum += freqData[i];
        speechCount++;
      }
      const speechAvg = speechCount > 0 ? speechSum / speechCount : 0;

      // --- 改进2: 结合时域 RMS 获得更准确的口型能量 ---
      // 初始化时分配正确大小的数组
      if (timeDataRef.current.length !== analyser.fftSize) {
        timeDataRef.current = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteTimeDomainData(timeDataRef.current);
      let rmsSum = 0;
      for (let i = 0; i < timeDataRef.current.length; i++) {
        const v = (timeDataRef.current[i] - 128) / 128;
        rmsSum += v * v;
      }
      const rms = Math.sqrt(rmsSum / timeDataRef.current.length);

      // --- 改进3: 混合频率和 RMS，频率主导、RMS 补细节 ---
      // freqPart: 频率成分（主导，开启灵敏）
      const freqPart = Math.pow(speechAvg / 90, 0.6);
      // rmsPart: 音量包络（辅助，让微小声也有动画）
      const rmsPart = Math.pow(rms / 0.15, 0.5);
      // 混合：频率权重 0.7，RMS 权重 0.3
      const combined = freqPart * 0.7 + rmsPart * 0.3;

      // --- 改进4: 自适应平滑系数（开口极快、闭口稍快） ---
      const prev = prevValueRef.current;
      // 新算法：开口极快(0.15旧+0.85新)，闭口也快(0.5旧+0.5新)
      const alpha = combined > prev ? 0.15 : 0.5;
      const smoothed = prev + (combined - prev) * (1 - alpha);
      const clamped = Math.min(Math.max(smoothed, 0), 1);

      if (Math.abs(clamped - prev) > 0.008) {
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
