import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewApi } from '../api/interview';

function decodeBase64Chunk(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function mergeAudioChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });
  return merged;
}

async function readSseAudioChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal?: AbortSignal
): Promise<Uint8Array[]> {
  const decoder = new TextDecoder();
  const audioChunks: Uint8Array[] = [];
  let buffer = '';

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    events.forEach((eventBlock) => {
      const data = eventBlock
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');

      if (data) {
        audioChunks.push(decodeBase64Chunk(data));
      }
    });
  }

  const trailingData = buffer
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');
  if (trailingData) {
    audioChunks.push(decodeBase64Chunk(trailingData));
  }

  return audioChunks;
}

interface UseQuestionVoicePlayerOptions {
  onError?: (message: string) => void;
}

interface UseQuestionVoicePlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  playQuestion: (text: string) => Promise<void>;
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

  const playQuestion = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      stopPlayback();
      return;
    }

    if (cachedQuestionTextRef.current === trimmedText && objectUrlRef.current) {
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
      const reader = await interviewApi.openQuestionTtsStream(trimmedText, abortController.signal);
      const chunks = await readSseAudioChunks(reader, abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }
      if (chunks.length === 0) {
        throw new Error('题目语音生成失败');
      }

      const audioBlob = new Blob([mergeAudioChunks(chunks)], { type: 'audio/mpeg' });
      const objectUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = objectUrl;
      cachedQuestionTextRef.current = trimmedText;
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
