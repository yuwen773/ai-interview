import { useCallback, useEffect, useRef, useState } from 'react';
import { audioApi } from '../api/audio';

interface UseVoiceInputOptions {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const isSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/wav';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : '无法访问麦克风');
    }
  }, []);

  const stopListening = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        recorder.stream.getTracks().forEach(t => t.stop());
        mediaRecorderRef.current = null;
        setIsListening(false);

        if (blob.size < 1024) {
          resolve();
          return;
        }

        setIsTranscribing(true);
        try {
          const { text } = await audioApi.asr(blob);
          if (text.trim()) onResultRef.current(text.trim());
        } catch (err) {
          onErrorRef.current?.(err instanceof Error ? err.message : '语音识别失败');
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };
      recorder.stop();
    });
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stream.getTracks().forEach(t => t.stop());
        recorder.stop();
      }
    };
  }, []);

  return { isListening, isTranscribing, isSupported, toggle, startListening, stopListening };
}
