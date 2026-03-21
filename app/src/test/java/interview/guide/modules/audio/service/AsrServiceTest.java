package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionModel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.audio.transcription.AudioTranscription;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("ASR 语音转文字服务测试")
class AsrServiceTest {

    @Test
    @DisplayName("转录时应使用上传的音频文件")
    void shouldTranscribeUploadedMultipartFile() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        AudioTranscriptionResponse response = new AudioTranscriptionResponse(new AudioTranscription("识别结果"));
        when(model.call(any(AudioTranscriptionPrompt.class))).thenReturn(response);
        AsrService asrService = new AsrService(model);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1, 2, 3});

        String result = asrService.transcribe(file);

        assertEquals("识别结果", result);
        ArgumentCaptor<AudioTranscriptionPrompt> captor = ArgumentCaptor.forClass(AudioTranscriptionPrompt.class);
        verify(model).call(captor.capture());
        assertEquals("speech.wav", captor.getValue().getInstructions().getFilename());
        assertTrue(captor.getValue().getInstructions().exists());
    }

    @Test
    @DisplayName("空文件应直接返回空字符串")
    void shouldReturnEmptyStringForEmptyFile() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        AsrService asrService = new AsrService(model);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[0]);

        String result = asrService.transcribe(file);

        assertEquals("", result);
    }
}
