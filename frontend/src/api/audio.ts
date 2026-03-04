import axios from 'axios';

const baseURL = import.meta.env.PROD ? '' : 'http://localhost:8080';

export const audioApi = {
  // ASR 语音转文字
  async asr(file: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file, 'recording.webm');

    const response = await axios.post(`${baseURL}/api/audio/asr`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // TTS 文字转语音
  async tts(text: string, voice = 'longhua', speed = 1.0): Promise<Blob> {
    const response = await axios.post(
      `${baseURL}/api/audio/tts`,
      { text, voice, speed },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // 流式 TTS
  async *streamTts(text: string, voice = 'longhua', speed = 1.0) {
    const response = await fetch(`${baseURL}/api/audio/tts/stream`, {
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
