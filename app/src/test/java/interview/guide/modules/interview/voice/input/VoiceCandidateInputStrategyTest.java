package interview.guide.modules.interview.voice.input;

import interview.guide.common.exception.BusinessException;
import interview.guide.modules.audio.adapter.AsrAdapter;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("语音输入策略测试")
class VoiceCandidateInputStrategyTest {

    @Test
    @DisplayName("应调用 ASR 并返回识别文本")
    void shouldNormalizeVoiceAnswer() {
        AsrAdapter asrAdapter = mock(AsrAdapter.class);
        VoiceCandidateInputStrategy strategy = new VoiceCandidateInputStrategy(asrAdapter);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1});
        when(asrAdapter.transcribe(file)).thenReturn("语音识别文本");
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT);

        NormalizedAnswer answer = strategy.normalize(input);

        assertEquals("语音识别文本", answer.answerText());
        assertEquals("语音识别文本", answer.recognizedText());
        assertEquals(CandidateInputMode.VOICE, answer.inputMode());
    }

    @Test
    @DisplayName("空音频应抛出异常")
    void shouldRejectEmptyAudioFile() {
        VoiceCandidateInputStrategy strategy = new VoiceCandidateInputStrategy(mock(AsrAdapter.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[0]);
        InterviewTurnInput input = new InterviewTurnInput("session-1", 0, null, file, CandidateInputMode.VOICE, InterviewerOutputMode.TEXT);

        assertThrows(BusinessException.class, () -> strategy.normalize(input));
    }
}
