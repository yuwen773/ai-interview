import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionAudioBlob } from '../utils/interviewVoiceAudio';

interface UseQuestionVoicePlayerOptions {
  onError?: (message: string) => void;
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
  const { onError } = options;
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
    audio.onended = () => {
      setIsPlaying(false);
    };
    await audio.play();
    setIsPlaying(true);
    return true;
  }, []);

  const stopPlayback = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

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

  useEffect(() => stopPlayback, [stopPlayback]);

  return {
    isPlaying,
    isLoading,
    playQuestion,
    stopPlayback,
  };
}
