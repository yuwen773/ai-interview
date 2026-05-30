package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import interview.guide.modules.voiceinterview.service.QwenAsrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
@RequiredArgsConstructor
public class VoiceCandidateInputStrategy implements CandidateInputStrategy {

    private static final Set<String> SUPPORTED_CONTENT_TYPES = Set.of(
        "audio/wav", "audio/wave", "audio/x-wav", "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a"
    );

    private final QwenAsrService qwenAsrService;

    @Override
    public CandidateInputMode getMode() {
        return CandidateInputMode.VOICE;
    }

    @Override
    public NormalizedAnswer normalize(InterviewTurnInput input) {
        if (input.audioFile() == null || input.audioFile().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "语音文件不能为空");
        }
        String contentType = input.audioFile().getContentType();
        if (contentType != null && !SUPPORTED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "音频格式不受支持，请使用 wav/mp3/webm/ogg/m4a");
        }

        String sessionId = "ic-" + input.sessionId() + "-" + input.questionIndex();
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> finalText = new AtomicReference<>();
        AtomicReference<Throwable> errorHolder = new AtomicReference<>();

        try {
            qwenAsrService.startTranscription(sessionId, finalText::set, null, latch::countDown, errorHolder::set);

            byte[] audioData;
            try {
                audioData = input.audioFile().getBytes();
            } catch (Exception e) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "读取音频文件失败");
            }
            qwenAsrService.sendAudio(sessionId, audioData);

            boolean completed = latch.await(30, TimeUnit.SECONDS);
            if (!completed) {
                throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "语音识别超时");
            }

            Throwable error = errorHolder.get();
            if (error != null) {
                throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "语音识别失败: " + error.getMessage());
            }

            String recognizedText = finalText.get();
            if (recognizedText == null || recognizedText.isBlank()) {
                throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "语音识别结果为空");
            }

            log.info("[VoiceCandidateInputStrategy] ASR result: {}", recognizedText);
            return new NormalizedAnswer(recognizedText.trim(), recognizedText.trim(), getMode());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "语音识别被打断");
        } finally {
            qwenAsrService.stopTranscription(sessionId);
        }
    }
}