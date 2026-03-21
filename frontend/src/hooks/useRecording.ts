import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRecordingReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioUrl: string | null;
  clearRecording: () => void;
}

const TARGET_SAMPLE_RATE = 16_000;

function mergeBuffers(buffers: Float32Array[], totalLength: number): Float32Array {
  const result = new Float32Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }

  return result;
}

function downsampleBuffer(samples: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return samples;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(samples.length / sampleRateRatio);
  const result = new Float32Array(outputLength);

  let outputIndex = 0;
  let inputOffset = 0;

  while (outputIndex < outputLength) {
    const nextOffset = Math.round((outputIndex + 1) * sampleRateRatio);
    let accumulator = 0;
    let count = 0;

    for (let index = inputOffset; index < nextOffset && index < samples.length; index += 1) {
      accumulator += samples[index];
      count += 1;
    }

    result[outputIndex] = count > 0 ? accumulator / count : 0;
    outputIndex += 1;
    inputOffset = nextOffset;
  }

  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const closeAudioGraph = useCallback(() => {
    processorNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    processorNodeRef.current = null;
    sourceNodeRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    chunksRef.current = [];
    totalSamplesRef.current = 0;
    if (!isRecording) {
      closeAudioGraph();
      stopTracks();
    }
  }, [audioUrl, closeAudioGraph, isRecording, stopTracks]);

  const startRecording = useCallback(async () => {
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error('当前浏览器不支持录音');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContextCtor();
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const processorNode = audioContext.createScriptProcessor(4096, 1, 1);

      clearRecording();
      chunksRef.current = [];
      totalSamplesRef.current = 0;
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceNodeRef.current = sourceNode;
      processorNodeRef.current = processorNode;

      processorNode.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const copiedBuffer = new Float32Array(inputData.length);
        copiedBuffer.set(inputData);
        chunksRef.current.push(copiedBuffer);
        totalSamplesRef.current += copiedBuffer.length;
      };

      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [clearRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!isRecording || !audioContextRef.current || !processorNodeRef.current) {
      return null;
    }

    processorNodeRef.current.onaudioprocess = null;

    const mergedSamples = mergeBuffers(chunksRef.current, totalSamplesRef.current);
    const wavBlob = encodeWav(
      downsampleBuffer(mergedSamples, audioContextRef.current.sampleRate, TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE,
    );
    const url = URL.createObjectURL(wavBlob);

    setAudioUrl(url);
    setIsRecording(false);
    closeAudioGraph();
    stopTracks();

    return wavBlob;
  }, [closeAudioGraph, isRecording, stopTracks]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      closeAudioGraph();
      stopTracks();
    };
  }, [audioUrl, closeAudioGraph, stopTracks]);

  return { isRecording, startRecording, stopRecording, audioUrl, clearRecording };
}
