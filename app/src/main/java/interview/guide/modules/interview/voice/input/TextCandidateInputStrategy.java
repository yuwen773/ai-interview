package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import org.springframework.stereotype.Component;

@Component
public class TextCandidateInputStrategy implements CandidateInputStrategy {

    @Override
    public CandidateInputMode getMode() {
        return CandidateInputMode.TEXT;
    }

    @Override
    public NormalizedAnswer normalize(InterviewTurnInput input) {
        if (input.answerText() == null || input.answerText().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文本答案不能为空");
        }
        // 文本模式不做额外处理，只负责把输入标准化为统一模型。
        return new NormalizedAnswer(input.answerText().trim(), null, getMode());
    }
}
