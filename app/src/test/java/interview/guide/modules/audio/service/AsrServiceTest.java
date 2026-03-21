package interview.guide.modules.audio.service;

import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionModel;
import com.alibaba.cloud.ai.dashscope.audio.transcription.DashScopeAudioTranscriptionOptions;
import com.alibaba.cloud.ai.dashscope.audio.transcription.RecognitionResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import reactor.core.publisher.Flux;

import java.nio.ByteBuffer;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("ASR 语音转文字服务测试")
class AsrServiceTest {

    @Test
    @DisplayName("转录时应返回最后一段非空识别结果")
    void shouldReturnLatestRecognitionText() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        RecognitionResult partial = mock(RecognitionResult.class);
        RecognitionResult completed = mock(RecognitionResult.class);
        when(partial.getText()).thenReturn("识别");
        when(completed.getText()).thenReturn("识别结果");
        when(model.streamRecognition(any(), any(DashScopeAudioTranscriptionOptions.class)))
                .thenReturn(Flux.just(partial, completed));
        AsrService asrService = new AsrService(model);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1, 2, 3});

        String result = asrService.transcribe(file);

        assertEquals("识别结果", result);
        ArgumentCaptor<Flux<ByteBuffer>> audioCaptor = ArgumentCaptor.forClass(Flux.class);
        ArgumentCaptor<DashScopeAudioTranscriptionOptions> optionsCaptor =
                ArgumentCaptor.forClass(DashScopeAudioTranscriptionOptions.class);
        verify(model).streamRecognition(audioCaptor.capture(), optionsCaptor.capture());
        List<ByteBuffer> frames = audioCaptor.getValue().collectList().block();
        assertEquals(1, frames == null ? 0 : frames.size());
        assertEquals("wav", optionsCaptor.getValue().getFormat());
    }

    @Test
    @DisplayName("浏览器 webm opus 录音应映射为 opus 格式")
    void shouldMapBrowserWebmOpusToOpusFormat() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        RecognitionResult response = mock(RecognitionResult.class);
        when(response.getText()).thenReturn("测试");
        when(model.streamRecognition(any(), any(DashScopeAudioTranscriptionOptions.class)))
                .thenReturn(Flux.just(response));
        AsrService asrService = new AsrService(model);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "answer.webm",
                "audio/webm;codecs=opus",
                new byte[] {1, 2, 3}
        );

        asrService.transcribe(file);

        ArgumentCaptor<DashScopeAudioTranscriptionOptions> optionsCaptor =
                ArgumentCaptor.forClass(DashScopeAudioTranscriptionOptions.class);
        verify(model).streamRecognition(any(), optionsCaptor.capture());
        assertEquals("opus", optionsCaptor.getValue().getFormat());
    }

    @Test
    @DisplayName("大音频应拆分为多个 websocket 帧")
    void shouldSplitLargeAudioIntoMultipleFrames() {
        DashScopeAudioTranscriptionModel model = mock(DashScopeAudioTranscriptionModel.class);
        when(model.streamRecognition(any(), any(DashScopeAudioTranscriptionOptions.class)))
                .thenReturn(Flux.empty());
        AsrService asrService = new AsrService(model);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "speech.wav",
                "audio/wav",
                new byte[200_000]
        );

        asrService.transcribe(file);

        ArgumentCaptor<Flux<ByteBuffer>> audioCaptor = ArgumentCaptor.forClass(Flux.class);
        verify(model).streamRecognition(audioCaptor.capture(), any(DashScopeAudioTranscriptionOptions.class));
        List<ByteBuffer> frames = audioCaptor.getValue().collectList().block();
        assertEquals(4, frames == null ? 0 : frames.size());
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
