package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("文本输入策略测试")
class TextCandidateInputStrategyTest {

    @Test
    @DisplayName("应返回修剪后的文本答案")
    void shouldNormalizeTextAnswer() {
        TextCandidateInputStrategy strategy = new TextCandidateInputStrategy();
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, "  文本答案  ", null, CandidateInputMode.TEXT, InterviewerOutputMode.TEXT);

        NormalizedAnswer answer = strategy.normalize(input);

        assertEquals("文本答案", answer.answerText());
        assertEquals(CandidateInputMode.TEXT, answer.inputMode());
    }

    @Test
    @DisplayName("空文本应抛出异常")
    void shouldRejectBlankTextAnswer() {
        TextCandidateInputStrategy strategy = new TextCandidateInputStrategy();
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, "   ", null, CandidateInputMode.TEXT, InterviewerOutputMode.TEXT);

        assertThrows(BusinessException.class, () -> strategy.normalize(input));
    }
}
