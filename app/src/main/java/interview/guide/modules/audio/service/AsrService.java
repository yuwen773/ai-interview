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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.List;

/**
 * 语音转文字 (ASR) 服务
 *
 * 集成 DashScope ASR  TTS/ASR 支持。
 */
@Service
public class AsrService {

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
                .model(DashScopeModel.AudioModel.QWEN3_ASR_FLASH.getValue())
                .languageHints(List.of("zh", "en"))
                .disfluencyRemovalEnabled(false)
                .punctuationPredictionEnabled(true)
                .build();
        // DashScope 需要可重复读取的 Resource，这里直接把上传内容包成内存资源。
        Resource audioFile = toAudioResource(file);
        AudioTranscriptionPrompt transcriptionRequest = new AudioTranscriptionPrompt(audioFile, transcriptionOptions);
        AudioTranscriptionResponse response = dashScopeAudioTranscriptionModel.call(transcriptionRequest);

        return response.getResult().getOutput();
    }



    public void  transcribeStream(MultipartFile file){
        if (file == null || file.isEmpty()) {
            return ;
        }

//            DashScopeAudioTranscriptionOptions speechOptions = DashScopeAudioTranscriptionOptions.builder()
//                    .model(DashScopeModel.AudioModel.QWEN3_TTS_FLASH.getValue())
////                    .format(DashScopeAudioTranscriptionApi.AudioFormat.MP3)
//                    .format("mp3")
//                    .sampleRate(16000)
//                    .build();
            Resource audioResource = toAudioResource(file);
            AudioTranscriptionPrompt prompt = new AudioTranscriptionPrompt(audioResource);

            Flux<AudioTranscriptionResponse> responseStream = dashScopeAudioTranscriptionModel.stream(prompt);

            responseStream.subscribe(response -> {
                String text = response.getResult().getOutput();
                // 处理实时转录结果
                System.out.println("Transcribed: " + text);
            });
        }

    private Resource toAudioResource(MultipartFile file) {
        try {
            return new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    // 保留原始文件名，便于下游根据扩展名判断音频格式。
                    return file.getOriginalFilename();
                }
            };
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "读取上传音频失败");
        }
    }
}
