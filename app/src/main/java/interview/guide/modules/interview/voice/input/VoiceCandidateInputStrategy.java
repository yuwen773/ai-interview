package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.audio.adapter.AsrAdapter;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class VoiceCandidateInputStrategy implements CandidateInputStrategy {

    private static final Set<String> SUPPORTED_CONTENT_TYPES = Set.of(
        "audio/wav", "audio/wave", "audio/x-wav", "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a"
    );

    // 语音模式下唯一职责是把音频转成可提交给面试主流程的文本。
    private final AsrAdapter asrAdapter;

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
        String recognizedText = asrAdapter.transcribe(input.audioFile());
        if (recognizedText == null || recognizedText.isBlank()) {
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR, "语音识别结果为空");
        }
        // 一期阶段先把识别文本直接作为标准答案文本，后续再接人工复查流程。
        return new NormalizedAnswer(recognizedText.trim(), recognizedText.trim(), getMode());
    }
}
