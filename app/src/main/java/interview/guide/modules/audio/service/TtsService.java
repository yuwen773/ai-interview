package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.tts.DashScopeAudioSpeechOptions;
import com.alibaba.cloud.ai.dashscope.spec.DashScopeModel;
import interview.guide.modules.audio.model.TtsStreamChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 文字转语音 (TTS) 服务 - 使用 Spring AI TextToSpeechModel
 */
@Service
public class TtsService {

    private static final Logger log = LoggerFactory.getLogger(TtsService.class);

    private final TextToSpeechModel textToSpeechModel;

    public TtsService(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
        log.info("TtsService initialized with TextToSpeechModel");
    }

    public byte[] synthesize(String text, String voice, Double speed) {
        log.info("TTS synthesize called: text={}, voice={}, speed={}", text, voice, speed);
        if (text == null || text.isEmpty()) {
            return new byte[0];
        }

        try {
            // 构建 TTS 选项
            OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
                    .model("tts-1")  // 使用 OpenAI TTS 模型
                    .voice(parseVoice(voice))
                    .speed(speed != null ? speed : 1.0)
                    .responseFormat(OpenAiAudioApi.SpeechRequest.AudioResponseFormat.MP3)
                    .build();

            // 创建请求并调用
            TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);
            TextToSpeechResponse response = textToSpeechModel.call(prompt);

            byte[] audioData = response.getResult().getOutput();
            log.info("TTS synthesize completed, audio size: {} bytes", audioData.length);
            return audioData;
        } catch (Exception e) {
            log.error("TTS synthesize failed: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    public Flux<byte[]> synthesizeStream(String text, String voice, Double speed) {
        log.info("TTS stream synthesize called: text={}, voice={}, speed={}", text, voice, speed);
        if (text == null || text.isEmpty()) {
            return Flux.empty();
        }

        try {
            OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
                    .model("tts-1")
                    .voice(parseVoice(voice))
                    .speed(speed != null ? speed : 1.0)
                    .responseFormat(OpenAiAudioApi.SpeechRequest.AudioResponseFormat.MP3)
                    .build();

            TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);

            // 流式返回每个音频块
            return textToSpeechModel.stream(prompt)
                    .map(response -> response.getResult().getOutput());
        } catch (Exception e) {
            log.error("TTS stream synthesize failed: {}", e.getMessage(), e);
            return Flux.empty();
        }
    }

    /**
     * Stream TTS output as SSE events
     * @param text Text to synthesize
     * @return SseEmitter that streams audio chunks
     */
    public SseEmitter streamTtsSse(String text) {
        SseEmitter emitter = new SseEmitter(30000L); // 30 second timeout

        if (text == null || text.isBlank()) {
            try {
                emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", "Text is empty")));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        // 使用 COSYVOICE_V3_FLASH 模型实现流式 TTS
        // FLASH 版本专为流式场景优化，延迟更低，适合实时语音合成
        DashScopeAudioSpeechOptions options = DashScopeAudioSpeechOptions.builder()
                .model(DashScopeModel.AudioModel.COSYVOICE_V3_FLASH.getValue())
                .textType("PlainText")
                .voice("longanyang")
                .format("mp3")
                .sampleRate(22050)
                .build();

        TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);

        AtomicInteger chunkIndex = new AtomicInteger(0);

        // 订阅流式响应，并添加完整的生命周期回调以确保资源正确清理
        textToSpeechModel.stream(prompt)
            .doOnComplete(() -> {
                try {
                    emitter.send(SseEmitter.event().name("end").data(TtsStreamChunk.end()));
                    emitter.complete();
                    log.info("TTS stream completed for text: {}", text.substring(0, Math.min(50, text.length())));
                } catch (IOException e) {
                    log.error("Error sending end event", e);
                    emitter.completeWithError(e);
                }
            })
            .doOnError(error -> {
                log.error("TTS stream error", error);
                emitter.completeWithError(error);
            })
            .doOnCancel(() -> {
                log.warn("TTS stream cancelled by client for text: {}",
                    text.substring(0, Math.min(50, text.length())));
                emitter.complete();
            })
            .doOnSubscribe(subscription -> {
                log.debug("TTS stream subscription started for text: {}",
                    text.substring(0, Math.min(50, text.length())));
            })
            .subscribe(response -> {
                try {
                    byte[] audioBytes = response.getResult().getOutput();
                    if (audioBytes != null && audioBytes.length > 0) {
                        TtsStreamChunk chunk = TtsStreamChunk.audio(audioBytes, chunkIndex.getAndIncrement());
                        emitter.send(SseEmitter.event().name("audio").data(chunk));
                        log.debug("Sent TTS chunk {}, size: {} bytes", chunk.index(), audioBytes.length);
                    }
                } catch (IOException e) {
                    log.error("Error sending audio chunk", e);
                    emitter.completeWithError(e);
                }
            });

        // 当 SseEmitter 完成或超时时，确保清理相关资源
        emitter.onCompletion(() -> {
            log.debug("SseEmitter completed for TTS stream");
        });
        emitter.onTimeout(() -> {
            log.warn("SseEmitter timed out for TTS stream");
            emitter.complete();
        });

        return emitter;
    }

    /**
     * 将自定义声音名称转换为 OpenAI 声音枚举
     */
    private OpenAiAudioApi.SpeechRequest.Voice parseVoice(String voice) {
        if (voice == null || voice.isEmpty()) {
            return OpenAiAudioApi.SpeechRequest.Voice.ALLOY;
        }

        // 映射中文声音名称到 OpenAI 声音
        return switch (voice.toLowerCase()) {
            case "longhua", "龙华" -> OpenAiAudioApi.SpeechRequest.Voice.ALLOY;
            case "yujie", "雨洁" -> OpenAiAudioApi.SpeechRequest.Voice.ECHO;
            case "aixia", "爱霞" -> OpenAiAudioApi.SpeechRequest.Voice.FABLE;
            case "xiaowei", "小微" -> OpenAiAudioApi.SpeechRequest.Voice.ONYX;
            case "xiaona", "小娜" -> OpenAiAudioApi.SpeechRequest.Voice.NOVA;
            case "xiaoyang", "小阳" -> OpenAiAudioApi.SpeechRequest.Voice.SHIMMER;
            default -> OpenAiAudioApi.SpeechRequest.Voice.ALLOY;
        };
    }
}
