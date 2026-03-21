import { interviewApi } from '../api/interview';
import type { QuestionVoiceCacheIdentity } from './interviewVoiceCache';
import { getQuestionAudio, setQuestionAudio } from './interviewVoiceCache';

const DEFAULT_VOICE_PARAMS_HASH = 'qwen3-tts-flash:Cherry:mp3:1.0:48000:50:1.0';

const inFlightRequests = new Map<string, Promise<Blob>>();

function decodeBase64Chunk(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
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

export interface QuestionVoiceRequest extends QuestionVoiceCacheIdentity {
  voiceParamsHash?: string;
}

function toCacheIdentity(request: QuestionVoiceRequest): QuestionVoiceCacheIdentity {
  return {
    sessionId: request.sessionId,
    questionIndex: request.questionIndex,
    text: request.text.trim(),
    voiceParamsHash: request.voiceParamsHash ?? DEFAULT_VOICE_PARAMS_HASH,
  };
}

function buildInFlightKey(request: QuestionVoiceRequest): string {
  const identity = toCacheIdentity(request);
  return `${identity.sessionId}:${identity.questionIndex}:${identity.voiceParamsHash}:${identity.text}`;
}

export async function getCachedQuestionAudioBlob(request: QuestionVoiceRequest): Promise<Blob | null> {
  return getQuestionAudio(toCacheIdentity(request));
}

export async function fetchQuestionAudioBlob(
  request: QuestionVoiceRequest,
  signal?: AbortSignal
): Promise<Blob> {
  const trimmedText = request.text.trim();
  if (!trimmedText) {
    throw new Error('题目内容不能为空');
  }

  const identity = toCacheIdentity({ ...request, text: trimmedText });
  const cachedBlob = await getQuestionAudio(identity);
  if (cachedBlob) {
    return cachedBlob;
  }

  const inFlightKey = buildInFlightKey({ ...request, text: trimmedText });
  if (!signal && inFlightRequests.has(inFlightKey)) {
    return inFlightRequests.get(inFlightKey)!;
  }

  const requestPromise = (async () => {
    const reader = await interviewApi.openQuestionTtsStream(trimmedText, signal);
    const chunks = await readSseAudioChunks(reader, signal);
    if (chunks.length === 0) {
      throw new Error('题目语音生成失败');
    }

    const audioBlob = new Blob([mergeAudioChunks(chunks)], { type: 'audio/mpeg' });
    await setQuestionAudio(identity, audioBlob);
    return audioBlob;
  })();

  if (!signal) {
    inFlightRequests.set(inFlightKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (!signal) {
      inFlightRequests.delete(inFlightKey);
    }
  }
}

