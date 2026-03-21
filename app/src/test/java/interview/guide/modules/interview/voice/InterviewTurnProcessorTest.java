package interview.guide.modules.interview.voice;

import interview.guide.common.exception.BusinessException;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.input.CandidateInputStrategy;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import interview.guide.modules.interview.voice.output.InterviewerOutputStrategy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("面试轮次编排器测试")
class InterviewTurnProcessorTest {

    @Test
    @DisplayName("应按输入输出模式选择策略并完成编排")
    void shouldProcessTurnWithMatchingStrategies() {
        InterviewSessionService sessionService = mock(InterviewSessionService.class);
        CandidateInputStrategy inputStrategy = mock(CandidateInputStrategy.class);
        InterviewerOutputStrategy outputStrategy = mock(InterviewerOutputStrategy.class);
        InterviewQuestionDTO nextQuestion = InterviewQuestionDTO.create(1, "介绍一个项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目");
        SubmitAnswerResponse submitAnswerResponse = new SubmitAnswerResponse(true, nextQuestion, 1, 3);
        InterviewTurnResponse expectedResponse = new InterviewTurnResponse("识别文本", true, nextQuestion, 1, 3, InterviewerOutputMode.TEXT_VOICE);
        when(inputStrategy.getMode()).thenReturn(CandidateInputMode.VOICE);
        when(outputStrategy.getMode()).thenReturn(InterviewerOutputMode.TEXT_VOICE);
        when(inputStrategy.normalize(any())).thenReturn(new NormalizedAnswer("识别文本", "识别文本", CandidateInputMode.VOICE));
        when(sessionService.submitAnswer(any())).thenReturn(submitAnswerResponse);
        when(outputStrategy.build(submitAnswerResponse, "识别文本")).thenReturn(expectedResponse);
        InterviewTurnProcessor processor = new InterviewTurnProcessor(sessionService, List.of(inputStrategy), List.of(outputStrategy));
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, null, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT_VOICE);

        InterviewTurnResponse actual = processor.process(input);

        assertEquals(expectedResponse, actual);
    }

    @Test
    @DisplayName("缺少输入策略时应抛出异常")
    void shouldRejectUnsupportedInputMode() {
        InterviewTurnProcessor processor = new InterviewTurnProcessor(mock(InterviewSessionService.class), List.of(), List.of());
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, "文本", null, CandidateInputMode.TEXT, InterviewerOutputMode.TEXT);

        assertThrows(BusinessException.class, () -> processor.process(input));
    }
}
