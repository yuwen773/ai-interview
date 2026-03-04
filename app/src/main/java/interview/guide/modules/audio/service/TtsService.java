package interview.guide.modules.audio.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

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
