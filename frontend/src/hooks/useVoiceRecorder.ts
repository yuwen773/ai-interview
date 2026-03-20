import { useState, useRef, useEffect } from 'react';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;

      // Try different MIME types for browser compatibility
      let mimeType = 'audio/webm';
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recorder active'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm'
        });
        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorderRef.current.onerror = () => {
        setIsRecording(false);
        reject(new Error('Recording error'));
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording, error };
}
