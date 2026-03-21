package interview.guide.modules.interview;

import interview.guide.common.result.Result;
import interview.guide.modules.interview.model.VoiceRecognizeResponse;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.InterviewTurnProcessor;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("面试控制器测试")
class InterviewControllerTest {

    @Test
    @DisplayName("语音识别接口应返回识别文本且不推进会话")
    void shouldRecognizeVoiceAnswerWithoutSubmitting() {
        InterviewSessionService sessionService = mock(InterviewSessionService.class);
        InterviewHistoryService historyService = mock(InterviewHistoryService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewTurnProcessor turnProcessor = mock(InterviewTurnProcessor.class);
        InterviewController controller = new InterviewController(sessionService, historyService, persistenceService, turnProcessor);
        MockMultipartFile file = new MockMultipartFile("file", "answer.webm", "audio/webm", new byte[] {1, 2, 3});
        when(turnProcessor.recognize(any())).thenReturn(
            new NormalizedAnswer("识别后的文本", "识别后的文本", CandidateInputMode.VOICE)
        );

        Result<VoiceRecognizeResponse> result = controller.recognizeVoiceAnswer("session-1", 2, file);

        assertEquals(200, result.getCode());
        assertEquals("识别后的文本", result.getData().recognizedText());
        verify(turnProcessor).recognize(
            new InterviewTurnInput("session-1", 2, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT)
        );
    }
}
