package interview.guide.modules.interview.voice.output;

import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("面试官输出策略测试")
class InterviewerOutputStrategyTest {

    @Test
    @DisplayName("文本输出策略应保留文字模式")
    void shouldBuildTextOnlyResponse() {
        InterviewQuestionDTO nextQuestion = InterviewQuestionDTO.create(1, "下一个问题", InterviewQuestionDTO.QuestionType.PROJECT, "项目");
        SubmitAnswerResponse response = new SubmitAnswerResponse(true, nextQuestion, 1, 3);
        TextOnlyOutputStrategy strategy = new TextOnlyOutputStrategy();

        InterviewTurnResponse turnResponse = strategy.build(response, "识别文本");

        assertEquals("识别文本", turnResponse.recognizedText());
        assertEquals(InterviewerOutputMode.TEXT, turnResponse.interviewerOutputMode());
        assertEquals(nextQuestion, turnResponse.nextQuestion());
    }

    @Test
    @DisplayName("文字加语音策略应标记语音输出模式")
    void shouldBuildTextAndVoiceResponse() {
        SubmitAnswerResponse response = new SubmitAnswerResponse(false, null, 3, 3);
        TextAndVoiceOutputStrategy strategy = new TextAndVoiceOutputStrategy();

        InterviewTurnResponse turnResponse = strategy.build(response, null);

        assertEquals(InterviewerOutputMode.TEXT_VOICE, turnResponse.interviewerOutputMode());
        assertEquals(3, turnResponse.currentQuestionIndex());
    }
}
