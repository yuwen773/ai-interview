package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import interview.guide.modules.voiceinterview.service.QwenAsrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

@DisplayName("语音输入策略测试")
class VoiceCandidateInputStrategyTest {

    @Test
    @DisplayName("应调用 ASR 并返回识别文本")
    void shouldNormalizeVoiceAnswer() {
        QwenAsrService qwenAsrService = mock(QwenAsrService.class);
        doAnswer(invocation -> {
            Consumer<String> onText = invocation.getArgument(1);
            onText.accept("语音识别文本");
            Runnable onComplete = invocation.getArgument(3);
            onComplete.run();
            return null;
        }).when(qwenAsrService).startTranscription(any(), any(), any(), any(), any());
        VoiceCandidateInputStrategy strategy = new VoiceCandidateInputStrategy(qwenAsrService);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1});
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT);

        NormalizedAnswer answer = strategy.normalize(input);

        assertEquals("语音识别文本", answer.answerText());
        assertEquals("语音识别文本", answer.recognizedText());
        assertEquals(CandidateInputMode.VOICE, answer.inputMode());
    }

    @Test
    @DisplayName("空音频应抛出异常")
    void shouldRejectEmptyAudioFile() {
        VoiceCandidateInputStrategy strategy = new VoiceCandidateInputStrategy(mock(QwenAsrService.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[0]);
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT);

        assertThrows(BusinessException.class, () -> strategy.normalize(input));
    }

    @Test
    @DisplayName("不支持的音频格式应抛出异常")
    void shouldRejectUnsupportedAudioFormat() {
        VoiceCandidateInputStrategy strategy = new VoiceCandidateInputStrategy(mock(QwenAsrService.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.flac", "audio/flac", new byte[] {1});
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT);

        assertThrows(BusinessException.class, () -> strategy.normalize(input));
    }
}
