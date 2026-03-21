package interview.guide.modules.audio.adapter;

import interview.guide.modules.audio.service.AsrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ASR Adapter 测试")
class DefaultAsrAdapterTest {

    @Test
    @DisplayName("应委托给 AsrService 处理转录")
    void shouldDelegateTranscription() {
        AsrService asrService = mock(AsrService.class);
        DefaultAsrAdapter adapter = new DefaultAsrAdapter(asrService);
        MockMultipartFile file = new MockMultipartFile("file", "speech.wav", "audio/wav", new byte[] {1});
        when(asrService.transcribe(file)).thenReturn("识别文本");

        assertEquals("识别文本", adapter.transcribe(file));
    }
}
