package interview.guide.modules.audio.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.audio.tts.Speech;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("TTS 文字转语音服务测试")
class TtsServiceTest {

    @Test
    @DisplayName("空白文本应返回空字节数组")
    void shouldReturnEmptyBytesForBlankText() {
        TtsService ttsService = new TtsService(mock(TextToSpeechModel.class), mock(VoiceMetrics.class));

        assertEquals(0, ttsService.synthesize("   ").length);
    }

    @Test
    @DisplayName("应返回模型生成的音频字节")
    void shouldSynthesizeAudioBytes() {
        TextToSpeechModel model = mock(TextToSpeechModel.class);
        byte[] expected = new byte[] {1, 2, 3};
        TextToSpeechResponse response = new TextToSpeechResponse(List.of(new Speech(expected)));
        when(model.call(any(TextToSpeechPrompt.class))).thenReturn(response);
        TtsService ttsService = new TtsService(model, mock(VoiceMetrics.class));

        byte[] actual = ttsService.synthesize("你好");

        assertArrayEquals(expected, actual);
    }

    @Test
    @DisplayName("同步合成返回空音频时应回退到流式聚合")
    void shouldFallbackToStreamAggregationWhenCallReturnsEmptyAudio() {
        TextToSpeechModel model = mock(TextToSpeechModel.class);
        TextToSpeechResponse emptyResponse = new TextToSpeechResponse(List.of(new Speech(new byte[0])));
        TextToSpeechResponse first = new TextToSpeechResponse(List.of(new Speech(new byte[] {1})));
        TextToSpeechResponse second = new TextToSpeechResponse(List.of(new Speech(new byte[] {2, 3})));
        when(model.call(any(TextToSpeechPrompt.class))).thenReturn(emptyResponse);
        when(model.stream(any(TextToSpeechPrompt.class))).thenReturn(Flux.just(first, second));
        TtsService ttsService = new TtsService(model, mock(VoiceMetrics.class));

        byte[] actual = ttsService.synthesize("你好");

        assertArrayEquals(new byte[] {1, 2, 3}, actual);
    }

    @Test
    @DisplayName("流式合成应返回每个音频块")
    void shouldStreamAudioBytes() {
        TextToSpeechModel model = mock(TextToSpeechModel.class);
        TextToSpeechResponse first = new TextToSpeechResponse(List.of(new Speech(new byte[] {1})));
        TextToSpeechResponse second = new TextToSpeechResponse(List.of(new Speech(new byte[] {2, 3})));
        when(model.stream(any(TextToSpeechPrompt.class))).thenReturn(Flux.just(first, second));
        TtsService ttsService = new TtsService(model, mock(VoiceMetrics.class));

        List<byte[]> chunks = ttsService.synthesizeStream("你好").collectList().block();

        assertEquals(2, chunks.size());
        assertArrayEquals(new byte[] {1}, chunks.get(0));
        assertArrayEquals(new byte[] {2, 3}, chunks.get(1));
    }
}
