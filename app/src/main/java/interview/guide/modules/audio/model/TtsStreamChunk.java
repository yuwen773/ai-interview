package interview.guide.modules.audio.model;

import java.util.Base64;

/**
 * TTS audio chunk for SSE streaming
 */
public record TtsStreamChunk(
        String chunk,      // Base64 encoded audio data
        int index,         // Chunk sequence number
        boolean isEnd      // true for the last chunk
) {
    public static TtsStreamChunk audio(byte[] audioBytes, int index) {
        String base64 = Base64.getEncoder().encodeToString(audioBytes);
        return new TtsStreamChunk(base64, index, false);
    }

    public static TtsStreamChunk end() {
        return new TtsStreamChunk("", 0, true);
    }
}
