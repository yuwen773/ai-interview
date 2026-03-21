package interview.guide.modules.interview;

import interview.guide.common.result.Result;
import interview.guide.modules.audio.adapter.TtsAdapter;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.TtsStreamRequest;
import interview.guide.modules.interview.model.VoiceRecognizeResponse;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.InterviewTurnProcessor;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.codec.ServerSentEvent;

import java.util.List;
import java.util.Map;
import java.util.Base64;

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
        TtsAdapter ttsAdapter = mock(TtsAdapter.class);
        InterviewController controller = new InterviewController(sessionService, historyService, persistenceService, turnProcessor, ttsAdapter);
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

    @Test
    @DisplayName("提交答案接口应透传输出模式并返回统一轮次响应")
    void shouldSubmitAnswerWithInterviewerOutputMode() {
        InterviewSessionService sessionService = mock(InterviewSessionService.class);
        InterviewHistoryService historyService = mock(InterviewHistoryService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewTurnProcessor turnProcessor = mock(InterviewTurnProcessor.class);
        TtsAdapter ttsAdapter = mock(TtsAdapter.class);
        InterviewController controller = new InterviewController(sessionService, historyService, persistenceService, turnProcessor, ttsAdapter);
        InterviewTurnResponse turnResponse = new InterviewTurnResponse(
            null,
            true,
            InterviewQuestionDTO.create(1, "下一题", null, "项目经验"),
            1,
            3,
            InterviewerOutputMode.TEXT_VOICE
        );
        when(turnProcessor.process(any())).thenReturn(turnResponse);

        Result<InterviewTurnResponse> result = controller.submitAnswer("session-1", Map.of(
            "questionIndex", 0,
            "answer", "这是回答",
            "interviewerOutputMode", "textVoice"
        ));

        assertEquals(200, result.getCode());
        assertEquals(InterviewerOutputMode.TEXT_VOICE, result.getData().interviewerOutputMode());
        verify(turnProcessor).process(
            new InterviewTurnInput("session-1", 0, "这是回答", null, CandidateInputMode.TEXT, InterviewerOutputMode.TEXT_VOICE)
        );
    }

    @Test
    @DisplayName("题目 TTS 流接口应返回 Base64 音频块")
    void shouldStreamQuestionTtsAsBase64Sse() {
        InterviewSessionService sessionService = mock(InterviewSessionService.class);
        InterviewHistoryService historyService = mock(InterviewHistoryService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewTurnProcessor turnProcessor = mock(InterviewTurnProcessor.class);
        TtsAdapter ttsAdapter = mock(TtsAdapter.class);
        InterviewController controller = new InterviewController(sessionService, historyService, persistenceService, turnProcessor, ttsAdapter);
        when(ttsAdapter.synthesize("请介绍你的项目")).thenReturn(new byte[] {1, 2, 3});

        List<ServerSentEvent<String>> events = controller.streamQuestionTts(new TtsStreamRequest("请介绍你的项目"))
            .collectList()
            .block();

        assertEquals(1, events.size());
        assertEquals("audio", events.get(0).event());
        assertEquals(Base64.getEncoder().encodeToString(new byte[] {1, 2, 3}), events.get(0).data());
        verify(ttsAdapter).synthesize("请介绍你的项目");
    }
}
