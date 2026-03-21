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
import java.util.List;

/**
 * 语音转文字 (ASR) 服务
 *
 * 集成 DashScope ASR  TTS/ASR 支持。
 */
@Service
public class AsrService {

    private static final int MAX_AUDIO_FRAME_BYTES = 64 * 1024;
    private static final Logger log = LoggerFactory.getLogger(AsrService.class);
    private final DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel;

    public AsrService(@Qualifier("dashScopeAudioTranscriptionModel") DashScopeAudioTranscriptionModel dashScopeAudioTranscriptionModel) {
        this.dashScopeAudioTranscriptionModel = dashScopeAudioTranscriptionModel;
        log.info("AsrService initialized with TranscriptionModel");

    }

    /**
     * 语音转文字
     * 返回模拟文本用于测试
     */
    public String transcribe(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "";
        }

        log.info("ASR request: file size={} bytes, contentType={}", file.getSize(), file.getContentType());
        DashScopeAudioTranscriptionOptions transcriptionOptions = DashScopeAudioTranscriptionOptions.builder()
                .model(DashScopeModel.AudioModel.PARAFORMER_REALTIME_V2.getValue())
                .format(resolveAudioFormat(file))
                .sampleRate(16000)
                .languageHints(List.of("zh", "en"))
                .disfluencyRemovalEnabled(false)
                .punctuationPredictionEnabled(true)
                .build();
        Flux<ByteBuffer> audioStream = Flux.fromIterable(splitAudioFrames(readBytes(file)));

        return dashScopeAudioTranscriptionModel.streamRecognition(audioStream, transcriptionOptions)
                .map(RecognitionResult::getText)
                .filter(output -> output != null && !output.isBlank())
                .distinctUntilChanged()
                .reduce((previous, current) -> current)
                .blockOptional()
                .orElse("");
    }



    public void transcribeStream(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }

//            DashScopeAudioTranscriptionOptions speechOptions = DashScopeAudioTranscriptionOptions.builder()
//                    .model(DashScopeModel.AudioModel.QWEN3_TTS_FLASH.getValue())
////                    .format(DashScopeAudioTranscriptionApi.AudioFormat.MP3)
//                    .format("mp3")
//                    .sampleRate(16000)
//                    .build();
        Flux<ByteBuffer> audioStream = Flux.fromIterable(splitAudioFrames(readBytes(file)));
        Flux<RecognitionResult> responseStream = dashScopeAudioTranscriptionModel.streamRecognition(
                audioStream,
                DashScopeAudioTranscriptionOptions.builder()
                        .model(DashScopeModel.AudioModel.PARAFORMER_REALTIME_V2.getValue())
                        .format(resolveAudioFormat(file))
                        .sampleRate(16000)
                        .build()
        );

        responseStream.subscribe(response -> {
            String text = response.getText();
            // 处理实时转录结果
            System.out.println("Transcribed: " + text);
        });
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "读取上传音频失败");
        }
    }

    private List<ByteBuffer> splitAudioFrames(byte[] audioBytes) {
        List<ByteBuffer> frames = new ArrayList<>((audioBytes.length / MAX_AUDIO_FRAME_BYTES) + 1);
        for (int offset = 0; offset < audioBytes.length; offset += MAX_AUDIO_FRAME_BYTES) {
            int length = Math.min(MAX_AUDIO_FRAME_BYTES, audioBytes.length - offset);
            frames.add(ByteBuffer.wrap(audioBytes, offset, length));
        }
        return frames;
    }

    private String resolveAudioFormat(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.contains("/")) {
            String subtype = contentType.substring(contentType.indexOf('/') + 1);
            if (subtype.contains("codecs=opus")) {
                return "opus";
            }

            int codecSeparator = subtype.indexOf(';');
            if (codecSeparator >= 0) {
                subtype = subtype.substring(0, codecSeparator);
            }
            return subtype.toLowerCase();
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            int lastDotIndex = originalFilename.lastIndexOf('.');
            if (lastDotIndex >= 0 && lastDotIndex < originalFilename.length() - 1) {
                return originalFilename.substring(lastDotIndex + 1).toLowerCase();
            }
        }

        throw new BusinessException(ErrorCode.BAD_REQUEST, "无法识别音频格式");
    }
}
