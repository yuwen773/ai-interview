import request from './request';

export const audioApi = {
  // ASR 语音转文字
  async asr(file: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file, 'recording.wav');
    const text = await request.upload<string>('/api/audio/asr', formData);
    return { text };
  },

  // TTS 文字转语音
  async tts(text: string, voice = 'longhua', speed = 1.0): Promise<Blob> {
    const response = await fetch('/api/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed }),
    });
    return response.blob();
  },

  // 流式 TTS
  async *streamTts(text: string, voice = 'longhua', speed = 1.0) {
    const response = await fetch('/api/audio/tts/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      yield chunk;
    }
  },
};
