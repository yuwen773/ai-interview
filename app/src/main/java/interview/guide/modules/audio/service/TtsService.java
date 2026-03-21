package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.tts.DashScopeAudioSpeechOptions;
import com.alibaba.cloud.ai.dashscope.spec.DashScopeModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * 文字转语音 (TTS) 服务 - 使用 Spring AI Alibaba TextToSpeechModel
 */
@Service
public class TtsService {

    private static final Logger log = LoggerFactory.getLogger(TtsService.class);

    private final TextToSpeechModel textToSpeechModel;
    private final VoiceMetrics voiceMetrics;

    public TtsService(TextToSpeechModel textToSpeechModel, VoiceMetrics voiceMetrics) {
        this.textToSpeechModel = textToSpeechModel;
        this.voiceMetrics = voiceMetrics;
        log.info("TtsService initialized with TextToSpeechModel");
    }

    public byte[] synthesize(String text) {
        log.info("TTS synthesize called: text={}", text);
        if (text == null || text.isBlank()) {
            return new byte[0];
        }

        // 同步 TTS 是前端最稳定的消费方式，但底层返回空音频时要自动回退到流式聚合。
        long startTime = System.nanoTime();
        try {
            TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, buildSpeechOptions());
            TextToSpeechResponse response = textToSpeechModel.call(prompt);
            byte[] audioData = response.getResult().getOutput();
            if (audioData == null || audioData.length == 0) {
                log.warn("TTS synthesize completed but returned empty audio data, fallback to stream aggregation");
                byte[] fallbackAudio = collectStreamAudio(text);
                if (fallbackAudio.length == 0) {
                    voiceMetrics.recordTtsFailure(durationMs(startTime), text.length(), "sync_fallback", "empty_audio");
                } else {
                    voiceMetrics.recordTtsSuccess(durationMs(startTime), text.length(), "sync_fallback", fallbackAudio.length);
                }
                return fallbackAudio;
            }
            log.info("TTS synthesize completed, audio size: {} bytes", audioData.length);
            voiceMetrics.recordTtsSuccess(durationMs(startTime), text.length(), "sync", audioData.length);
            return audioData;
        } catch (Exception e) {
            log.error("TTS synthesize failed: {}, fallback to stream aggregation", e.getMessage(), e);
            byte[] fallbackAudio = collectStreamAudio(text);
            if (fallbackAudio.length == 0) {
                voiceMetrics.recordTtsFailure(durationMs(startTime), text.length(), "sync_fallback", e.getMessage());
            } else {
                voiceMetrics.recordTtsSuccess(durationMs(startTime), text.length(), "sync_fallback", fallbackAudio.length);
            }
            return fallbackAudio;
        }
    }

    public Flux<byte[]> synthesizeStream(String text) {
        log.info("TTS stream synthesize called: text={}", text);
        if (text == null || text.isBlank()) {
            return Flux.empty();
        }

        // 流式接口主要作为同步合成的降级路径，因此在这里顺手补齐完成/失败埋点。
        long startTime = System.nanoTime();
        try {
            TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, buildSpeechOptions());

            // 流式返回每个音频块
            return textToSpeechModel.stream(prompt)
                    .map(response -> response.getResult().getOutput())
                    .filter(chunk -> chunk != null && chunk.length > 0)
                    .doOnComplete(() -> voiceMetrics.recordTtsSuccess(durationMs(startTime), text.length(), "stream", -1))
                    .doOnError(error -> voiceMetrics.recordTtsFailure(durationMs(startTime), text.length(), "stream", error.getMessage()));
        } catch (Exception e) {
            log.error("TTS stream synthesize failed: {}", e.getMessage(), e);
            voiceMetrics.recordTtsFailure(durationMs(startTime), text.length(), "stream", e.getMessage());
            return Flux.empty();
        }
    }

    private DashScopeAudioSpeechOptions buildSpeechOptions() {
        return DashScopeAudioSpeechOptions.builder()
                .model(DashScopeModel.AudioModel.QWEN3_TTS_FLASH.getValue())
                .voice("Cherry")
                .format("mp3")
                .speed(1.0)
                .sampleRate(48000)
                .volume(50)
                .pitch(1.0F)
                .build();
    }

    private byte[] collectStreamAudio(String text) {
        try {
            List<byte[]> chunks = synthesizeStream(text).collectList().block();
            if (chunks == null || chunks.isEmpty()) {
                return new byte[0];
            }
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            for (byte[] chunk : chunks) {
                if (chunk != null && chunk.length > 0) {
                    outputStream.write(chunk);
                }
            }
            byte[] audioData = outputStream.toByteArray();
            log.info("TTS stream aggregation completed, audio size: {} bytes", audioData.length);
            return audioData;
        } catch (Exception e) {
            log.error("TTS stream aggregation failed: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    private long durationMs(long startTime) {
        return (System.nanoTime() - startTime) / 1_000_000;
    }
}
