package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionOptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.audio.transcription.AudioTranscription;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("ASR 语音转文字服务测试")
class AsrServiceTest {

    @Test
    @DisplayName("转录时应返回模型识别结果")
    void shouldReturnRecognitionText() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        when(model.call(any(AudioTranscriptionPrompt.class)))
            .thenReturn(new AudioTranscriptionResponse(new AudioTranscription("识别结果")));
        AsrService asrService = new AsrService(model, mock(VoiceMetrics.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1, 2, 3});

        String result = asrService.transcribe(file);

        assertEquals("识别结果", result);
        ArgumentCaptor<AudioTranscriptionPrompt> promptCaptor =
            ArgumentCaptor.forClass(AudioTranscriptionPrompt.class);
        verify(model).call(promptCaptor.capture());
        assertEquals("wav", ((DashScopeAudioTranscriptionOptions) promptCaptor.getValue().getOptions()).getFormat());
    }

    @Test
    @DisplayName("浏览器 webm opus 录音应映射为 webm 格式")
    void shouldMapBrowserWebmOpusToWebmFormat() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        when(model.call(any(AudioTranscriptionPrompt.class)))
            .thenReturn(new AudioTranscriptionResponse(new AudioTranscription("测试")));
        AsrService asrService = new AsrService(model, mock(VoiceMetrics.class));
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "answer.webm",
                "audio/webm;codecs=opus",
                new byte[] {1, 2, 3}
        );

        asrService.transcribe(file);

        ArgumentCaptor<AudioTranscriptionPrompt> promptCaptor =
            ArgumentCaptor.forClass(AudioTranscriptionPrompt.class);
        verify(model).call(promptCaptor.capture());
        assertEquals("webm", ((DashScopeAudioTranscriptionOptions) promptCaptor.getValue().getOptions()).getFormat());
    }

    @Test
    @DisplayName("空识别结果应返回空字符串")
    void shouldReturnEmptyStringForEmptyRecognitionResult() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        when(model.call(any(AudioTranscriptionPrompt.class)))
            .thenReturn(new AudioTranscriptionResponse(null));
        AsrService asrService = new AsrService(model, mock(VoiceMetrics.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1, 2, 3});

        String result = asrService.transcribe(file);

        assertEquals("", result);
    }

    @Test
    @DisplayName("空文件应直接返回空字符串")
    void shouldReturnEmptyStringForEmptyFile() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        AsrService asrService = new AsrService(model, mock(VoiceMetrics.class));
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[0]);

        String result = asrService.transcribe(file);

        assertEquals("", result);
    }
}
