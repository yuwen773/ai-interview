import { useEffect, useRef, useState } from 'react';

interface UseLipSyncReturn {
  mouthOpen: number; // 0-1
  startAnalyzing: (audioElement: HTMLAudioElement) => void;
  stopAnalyzing: () => void;
}

export function useLipSync(): UseLipSyncReturn {
  const [mouthOpen, setMouthOpen] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousValueRef = useRef(0);

  const startAnalyzing = (audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaElementSource(audioElement);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // 计算平均音量
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

      // 非线性映射 (0-1)
      const normalized = Math.pow(average / 128, 0.8);

      // 平滑处理
      const smoothed = previousValueRef.current * 0.6 + normalized * 0.4;
      previousValueRef.current = smoothed;

      setMouthOpen(smoothed);

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const stopAnalyzing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setMouthOpen(0);
    previousValueRef.current = 0;
  };

  // 清理
  useEffect(() => {
    return () => {
      stopAnalyzing();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { mouthOpen, startAnalyzing, stopAnalyzing };
}
