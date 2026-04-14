/**
 * useQuestionVoicePlayer - 题目语音播报 Hook
 *
 * 参考 NavTalk realtime.js 的 Web Audio 架构：
 * - AudioContext + AudioBufferSourceNode 播放音频
 * - 支持缓存和中断
 */
import { useCallback, useRef, useState } from 'react';
import { fetchQuestionAudioBlob } from '../utils/interviewVoiceAudio';

interface UseQuestionVoicePlayerOptions {
  onError?: (message: string) => void;
  /** AudioContext 就绪时回调，传入 ctx 用于建立分析链路 */
  onAudioContextReady?: (audioContext: AudioContext) => void;
  /** 播放开始时回调，传入当前 AudioBufferSourceNode 用于唇同步分析 */
  onPlaybackStart?: (source: AudioBufferSourceNode) => void;
  /** 播放结束时回调 */
  onPlaybackEnd?: () => void;
}

interface PlayQuestionOptions {
  sessionId: string;
  questionIndex: number;
}

interface UseQuestionVoicePlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  playQuestion: (text: string, options: PlayQuestionOptions) => Promise<void>;
  stopPlayback: () => void;
}

export function useQuestionVoicePlayer(
  options: UseQuestionVoicePlayerOptions = {}
): UseQuestionVoicePlayerReturn {
  const { onError, onAudioContextReady, onPlaybackStart, onPlaybackEnd } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // AudioContext 和音频源由本 Hook 管理
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioCacheRef = useRef<Map<string, ArrayBuffer>>(new Map());
  const cachedQuestionTextRef = useRef<string | null>(null);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      onAudioContextReady?.(audioContextRef.current);
    }
    return audioContextRef.current;
  }, [onAudioContextReady]);

  const stopCurrentSource = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
      } catch (_) {}
      currentSourceRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopCurrentSource();
    setIsPlaying(false);
    setIsLoading(false);
    onPlaybackEnd?.();
  }, [stopCurrentSource, onPlaybackEnd]);

  /**
   * 播放 ArrayBuffer（NavTalk playPCM 逻辑）
   * 使用 AudioContext.decodeAudioData + AudioBufferSourceNode
   */
  const playAudioBuffer = useCallback((buffer: ArrayBuffer) => {
    const ctx = getAudioContext();

    // 恢复 AudioContext（防止自动播放策略导致的 suspended 状态）
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopCurrentSource();

    // decodeAudioData 会 transfer（detach）传入的 ArrayBuffer，必须先复制
    ctx.decodeAudioData(
      buffer.slice(0),
      (decoded) => {
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);

        source.onended = () => {
          currentSourceRef.current = null;
          setIsPlaying(false);
          onPlaybackEnd?.();
        };

        currentSourceRef.current = source;
        source.start(0);

        setIsPlaying(true);
        // 通知外部开始分析（传入 source 建立分析链路）
        onPlaybackStart?.(source);
      },
      (err) => {
        console.error('[useQuestionVoicePlayer] decodeAudioData error:', err);
        setIsPlaying(false);
        onPlaybackEnd?.();
        onError?.('题目语音解码失败');
      }
    );
  }, [getAudioContext, stopCurrentSource, onPlaybackStart, onPlaybackEnd, onError]);

  const playQuestion = useCallback(async (text: string, options: PlayQuestionOptions) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      stopPlayback();
      return;
    }

    const cacheKey = `${options.sessionId}:${options.questionIndex}:${trimmedText}`;

    // 命中缓存：直接播放
    if (cachedQuestionTextRef.current === cacheKey && audioCacheRef.current.has(cacheKey)) {
      stopPlayback();
      playAudioBuffer(audioCacheRef.current.get(cacheKey)!);
      return;
    }

    // 中止旧请求，开始新请求
    stopPlayback();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);

    try {
      const audioBlob = await fetchQuestionAudioBlob({
        sessionId: options.sessionId,
        questionIndex: options.questionIndex,
        text: trimmedText,
      }, abortController.signal);

      if (abortController.signal.aborted) {
        return;
      }

      // Blob → ArrayBuffer（解码 MP3 数据）
      const arrayBuffer = await audioBlob.arrayBuffer();

      if (abortController.signal.aborted) {
        return;
      }

      // 缓存并播放
      audioCacheRef.current.set(cacheKey, arrayBuffer);
      cachedQuestionTextRef.current = cacheKey;
      playAudioBuffer(arrayBuffer);

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('[useQuestionVoicePlayer] playQuestion error:', error);
      onError?.(error instanceof Error ? error.message : '题目语音播放失败');
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, [stopPlayback, playAudioBuffer, onError]);

  return {
    isPlaying,
    isLoading,
    playQuestion,
    stopPlayback,
  };
}
