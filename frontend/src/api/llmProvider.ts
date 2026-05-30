import { request } from './request';

export interface ProviderItem {
  id: string;
  baseUrl: string;
  maskedApiKey: string;
  model: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  supportsEmbedding: boolean;
  temperature?: number;
  defaultChatProvider: boolean;
  defaultEmbeddingProvider: boolean;
}

export interface CreateProviderRequest {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  supportsEmbedding?: boolean;
  temperature?: number;
}

export interface UpdateProviderRequest {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  supportsEmbedding?: boolean;
  temperature?: number;
}

export interface ProviderTestResult {
  success: boolean;
  message: string;
  model: string;
}

export interface DefaultProviderDTO {
  defaultProvider: string;
  defaultEmbeddingProvider: string;
}

export interface AsrConfig {
  url: string;
  model: string;
  maskedApiKey: string;
  language: string;
  format: string;
  sampleRate: number;
  enableTurnDetection: boolean;
  turnDetectionType: string;
  turnDetectionThreshold: number;
  turnDetectionSilenceDurationMs: number;
}

export interface TtsConfig {
  model: string;
  maskedApiKey: string;
  voice: string;
  format: string;
  sampleRate: number;
  mode: string;
  languageType: string;
  speechRate: number;
  volume: number;
}

export interface AsrConfigRequest {
  url?: string;
  model?: string;
  apiKey?: string;
  language?: string;
  format?: string;
  sampleRate?: number;
  enableTurnDetection?: boolean;
  turnDetectionType?: string;
  turnDetectionThreshold?: number;
  turnDetectionSilenceDurationMs?: number;
}

export interface TtsConfigRequest {
  model?: string;
  apiKey?: string;
  voice?: string;
  format?: string;
  sampleRate?: number;
  mode?: string;
  languageType?: string;
  speechRate?: number;
  volume?: number;
}

export const llmProviderApi = {
  list(): Promise<ProviderItem[]> {
    return request.get('/api/llm-provider/list');
  },

  getProvider(id: string): Promise<ProviderItem> {
    return request.get(`/api/llm-provider/${id}`);
  },

  getDefaultProvider(): Promise<DefaultProviderDTO> {
    return request.get('/api/llm-provider/default-provider');
  },

  create(data: CreateProviderRequest): Promise<void> {
    return request.post('/api/llm-provider', data);
  },

  update(id: string, data: UpdateProviderRequest): Promise<void> {
    return request.put(`/api/llm-provider/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/llm-provider/${id}`);
  },

  test(id: string): Promise<ProviderTestResult> {
    return request.post(`/api/llm-provider/${id}/test`, {});
  },

  updateDefaultProvider(data: DefaultProviderDTO): Promise<void> {
    return request.put('/api/llm-provider/default-provider', data);
  },

  updateDefaultEmbeddingProvider(data: DefaultProviderDTO): Promise<void> {
    return request.put('/api/llm-provider/default-embedding-provider', data);
  },

  getAsrConfig(): Promise<AsrConfig> {
    return request.get('/api/llm-provider/voice/asr');
  },

  updateAsrConfig(data: AsrConfigRequest): Promise<void> {
    return request.put('/api/llm-provider/voice/asr', data);
  },

  getTtsConfig(): Promise<TtsConfig> {
    return request.get('/api/llm-provider/voice/tts');
  },

  updateTtsConfig(data: TtsConfigRequest): Promise<void> {
    return request.put('/api/llm-provider/voice/tts', data);
  },

  testAsr(): Promise<ProviderTestResult> {
    return request.post('/api/llm-provider/voice/asr/test', {});
  },
};