package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionOptions;
import com.alibaba.cloud.ai.dashscope.audio.transcription.RecognitionResult;
import com.alibaba.cloud.ai.dashscope.spec.DashScopeModel;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
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

    private static final int MAX_AUDIO_FRAME_BYTES = 64 * 1024;
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
     * 语音转文字
     */
    public String transcribe(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "";
        }

        // 识别链路要同时记录成功/失败和耗时，便于后续排查模型、网络或格式问题。
        long startTime = System.nanoTime();
        String format = "unknown";
        long fileSize = file.getSize();

        try {
            format = resolveAudioFormat(file);
            log.info("ASR request: file size={} bytes, contentType={}, format={}", fileSize, file.getContentType(), format);
            DashScopeAudioTranscriptionOptions transcriptionOptions = DashScopeAudioTranscriptionOptions.builder()
                    .model(DashScopeModel.AudioModel.PARAFORMER_REALTIME_V2.getValue())
                    .format(format)
                    .sampleRate(16000)
                    .languageHints(List.of("zh", "en"))
                    .disfluencyRemovalEnabled(false)
                    .punctuationPredictionEnabled(true)
                    .build();
            Flux<ByteBuffer> audioStream = Flux.fromIterable(splitAudioFrames(readBytes(file)));

            String recognizedText = dashScopeAudioTranscriptionModel.streamRecognition(audioStream, transcriptionOptions)
                    .map(RecognitionResult::getText)
                    .filter(output -> output != null && !output.isBlank())
                    .distinctUntilChanged()
                    .reduce((previous, current) -> current)
                    .blockOptional()
                    .orElse("");

            voiceMetrics.recordAsrSuccess(durationMs(startTime), format, fileSize);
            return recognizedText;
        } catch (BusinessException exception) {
            voiceMetrics.recordAsrFailure(durationMs(startTime), format, fileSize, exception.getMessage());
            throw exception;
        } catch (Exception exception) {
            voiceMetrics.recordAsrFailure(durationMs(startTime), format, fileSize, exception.getMessage());
            throw exception;
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "读取上传音频失败");
        }
    }

    private List<ByteBuffer> splitAudioFrames(byte[] audioBytes) {
        // 实时 ASR 对单帧大小更敏感，这里按固定上限切片，避免大文件一次性推送失败。
        List<ByteBuffer> frames = new ArrayList<>((audioBytes.length / MAX_AUDIO_FRAME_BYTES) + 1);
        for (int offset = 0; offset < audioBytes.length; offset += MAX_AUDIO_FRAME_BYTES) {
            int length = Math.min(MAX_AUDIO_FRAME_BYTES, audioBytes.length - offset);
            frames.add(ByteBuffer.wrap(audioBytes, offset, length));
        }
        return frames;
    }

    private String resolveAudioFormat(MultipartFile file) {
        // 浏览器上传的 content-type 和文件后缀经常不完全一致，优先收集多个候选值再统一判定。
        Set<String> candidates = new LinkedHashSet<>();
        String contentType = file.getContentType();
        if (contentType != null && contentType.contains("/")) {
            String subtype = contentType.substring(contentType.indexOf('/') + 1).toLowerCase(Locale.ROOT);
            if (subtype.contains("codecs=opus")) {
                candidates.add("opus");
            }

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
