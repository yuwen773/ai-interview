import { useRef, useState, useEffect } from 'react';

export interface UseVoicePlayerReturn {
  isPlaying: boolean;
  playAudioStream: (response: Response) => Promise<void>;
  stopPlayback: () => void;
  error: string | null;
}

export function useVoicePlayer(): UseVoicePlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const playAudioStream = async (response: Response) => {
    setError(null);
    audioQueueRef.current = [];
    isPlayingRef.current = true;
    setIsPlaying(true);

    try {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            // Extract event type from "event: audio" or "event: end"
            currentEventType = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.slice(5).trim();
              const data = JSON.parse(jsonStr);

              // Data is TtsStreamChunk: {chunk: string, index: number, isEnd: boolean}
              if (currentEventType === 'audio' && data.chunk && !data.isEnd) {
                audioQueueRef.current.push(data.chunk);
              } else if (currentEventType === 'end' || data.isEnd) {
                // End marker received
                break;
              } else if (currentEventType === 'error') {
                throw new Error(data.message || 'TTS error');
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', trimmed, parseError);
            }
          }
        }
      }

      // Start playing queued audio
      await playQueuedAudio();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Playback failed';
      setError(message);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const playQueuedAudio = async (): Promise<void> => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    audio.onended = () => {
      if (isPlayingRef.current && audioQueueRef.current.length > 0) {
        playNextChunk(audio);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };

    audio.onerror = (err) => {
      console.error('Audio playback error:', err);
      setError('Audio playback failed');
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    playNextChunk(audio);
  };

  const playNextChunk = (audio: HTMLAudioElement) => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const base64Audio = audioQueueRef.current.shift()!;
    audio.src = `data:audio/mp3;base64,${base64Audio}`;
    audio.play().catch(console.error);
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    audioQueueRef.current = [];
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  return { isPlaying, playAudioStream, stopPlayback, error };
}
