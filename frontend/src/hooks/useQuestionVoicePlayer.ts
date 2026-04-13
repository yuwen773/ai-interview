import { useCallback, useRef, useState } from 'react';
import { fetchQuestionAudioBlob } from '../utils/interviewVoiceAudio';

interface UseQuestionVoicePlayerOptions {
  onError?: (message: string) => void;
  /** 音频元素就绪回调，用于对接唇同步等分析工具 */
  onAudioElement?: (audio: HTMLAudioElement, isPlaying: boolean) => void;
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
  const { onError, onAudioElement } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const cachedQuestionTextRef = useRef<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const playCachedAudio = useCallback(async () => {
    if (!objectUrlRef.current) {
      return false;
    }

    const audio = new Audio(objectUrlRef.current);
    audioRef.current = audio;

    // 等待 AudioContext 就绪（部分浏览器需要用户交互后才能播放）
    let audioContextResume = false;
    audio.onplay = () => {
      setIsPlaying(true);
      onAudioElement?.(audio, true);
      audioContextResume = true;
    };
    audio.onended = () => {
      setIsPlaying(false);
      onAudioElement?.(audio, false);
    };
    audio.onerror = () => {
      // audio 加载/播放错误，不静默丢弃
      console.warn('[useQuestionVoicePlayer] audio error', audio.error);
      setIsPlaying(false);
      onAudioElement?.(audio, false);
    };

    try {
      await audio.play();
    } catch (err) {
      // audio.play() 静默失败（AudioContext suspended / autoplay blocked）
      // 此时 audio.onplay 不会触发，手动处理
      if (!audioContextResume) {
        console.warn('[useQuestionVoicePlayer] audio.play() rejected:', err);
        setIsPlaying(false);
        onAudioElement?.(audio, false);
      }
    }
    return true;
  }, [onAudioElement]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      onAudioElement?.(audio, false);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, [onAudioElement]);

  const playQuestion = useCallback(async (text: string, options: PlayQuestionOptions) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      stopPlayback();
      return;
    }

    const cacheKey = `${options.sessionId}:${options.questionIndex}:${trimmedText}`;
    if (cachedQuestionTextRef.current === cacheKey && objectUrlRef.current) {
      stopPlayback();
      await playCachedAudio();
      return;
    }

    stopPlayback();
    cleanupAudio();
    cachedQuestionTextRef.current = null;
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
      const objectUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = objectUrl;
      cachedQuestionTextRef.current = cacheKey;
      await playCachedAudio();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      cleanupAudio();
      cachedQuestionTextRef.current = null;
      onError?.(error instanceof Error ? error.message : '题目语音播放失败');
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      if (!audioRef.current) {
        setIsPlaying(false);
      }
    }
  }, [cleanupAudio, onError, playCachedAudio, stopPlayback]);

  return {
    isPlaying,
    isLoading,
    playQuestion,
    stopPlayback,
  };
}
