package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionOptions;
import com.alibaba.cloud.ai.dashscope.spec.DashScopeModel;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 语音转文字 (ASR) 服务
 *
 * 集成 DashScope ASR  TTS/ASR 支持。
 */
@Service
public class AsrService {

    private static final Set<String> SUPPORTED_AUDIO_FORMATS = Set.of("wav", "mp3", "mpeg", "webm", "ogg", "opus", "mp4", "m4a");
    private static final Logger log = LoggerFactory.getLogger(AsrService.class);
    private final DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel;
    private final VoiceMetrics voiceMetrics;

    public AsrService(
        @Qualifier("dashScopeAudioTranscriptionModel") DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel,
        VoiceMetrics voiceMetrics
    ) {
        this.dashScopeAudioTranscriptionModel = dashScopeAudioTranscriptionModel;
        this.voiceMetrics = voiceMetrics;
        log.info("AsrService initialized with TranscriptionModel");
    }

    /**
     * 语音转文字（非实时模型，一次性转录整段音频）
     */
    public String transcribe(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "";
        }

        long startTime = System.nanoTime();
        String format = "unknown";
        long fileSize = file.getSize();

        try {
            format = resolveAudioFormat(file);
            log.info("ASR request: file size={} bytes, contentType={}, format={}", fileSize, file.getContentType(), format);

            DashScopeAudioTranscriptionOptions transcriptionOptions = DashScopeAudioTranscriptionOptions.builder()
                    .model(DashScopeModel.AudioModel.PARAFORMER_V1.getValue())
                    .languageHints(List.of("zh", "en"))
                    .disfluencyRemovalEnabled(false)
                    .punctuationPredictionEnabled(true)
                    .build();

            AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(file.getResource(), transcriptionOptions);
            AudioTranscriptionResponse response = dashScopeAudioTranscriptionModel.call(prompt);

            String recognizedText = response.getResult() != null ? response.getResult().getOutput() : "";
            voiceMetrics.recordAsrSuccess(durationMs(startTime), format, fileSize);
            log.info("ASR result: {}", recognizedText);
            return recognizedText;
        } catch (BusinessException exception) {
            voiceMetrics.recordAsrFailure(durationMs(startTime), format, fileSize, exception.getMessage());
            throw exception;
        } catch (Exception exception) {
            voiceMetrics.recordAsrFailure(durationMs(startTime), format, fileSize, exception.getMessage());
            throw exception;
        }
    }

    private String resolveAudioFormat(MultipartFile file) {
        // 浏览器上传的 content-type 和文件后缀经常不完全一致，优先收集多个候选值再统一判定。
        // 注意：不能从 codecs 参数提取编解码器名称（如 opus）作为候选，
        // 因为 DashScope 的 format 参数指的是容器格式而非编解码器。
        // 例如 audio/webm;codecs=opus 的正确 format 是 "webm" 而不是 "opus"。
        Set<String> candidates = new LinkedHashSet<>();
        String contentType = file.getContentType();
        if (contentType != null && contentType.contains("/")) {
            String subtype = contentType.substring(contentType.indexOf('/') + 1).toLowerCase(Locale.ROOT);

            int codecSeparator = subtype.indexOf(';');
            if (codecSeparator >= 0) {
                subtype = subtype.substring(0, codecSeparator);
            }
            candidates.add(subtype);
            if ("x-wav".equals(subtype) || "wave".equals(subtype)) {
                candidates.add("wav");
            }
            if ("mpeg".equals(subtype)) {
                candidates.add("mp3");
            }
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            int lastDotIndex = originalFilename.lastIndexOf('.');
            if (lastDotIndex >= 0 && lastDotIndex < originalFilename.length() - 1) {
                candidates.add(originalFilename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT));
            }
        }

        for (String candidate : candidates) {
            if (SUPPORTED_AUDIO_FORMATS.contains(candidate)) {
                return "mpeg".equals(candidate) ? "mp3" : candidate;
            }
        }

        throw new BusinessException(ErrorCode.BAD_REQUEST, "仅支持 wav/mp3/webm/ogg/opus/m4a 音频格式");
    }

    private long durationMs(long startTime) {
        return (System.nanoTime() - startTime) / 1_000_000;
    }
}
