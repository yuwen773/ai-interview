package interview.guide.modules.audio.adapter;

import interview.guide.modules.audio.service.TtsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("TTS Adapter 测试")
class DefaultTtsAdapterTest {

    @Test
    @DisplayName("应委托给 TtsService 合成音频")
    void shouldDelegateSynthesize() {
        TtsService ttsService = mock(TtsService.class);
        DefaultTtsAdapter adapter = new DefaultTtsAdapter(ttsService);
        when(ttsService.synthesize("你好")).thenReturn(new byte[] {1, 2});

        assertArrayEquals(new byte[] {1, 2}, adapter.synthesize("你好"));
    }

    @Test
    @DisplayName("应委托给 TtsService 流式合成")
    void shouldDelegateSynthesizeStream() {
        TtsService ttsService = mock(TtsService.class);
        DefaultTtsAdapter adapter = new DefaultTtsAdapter(ttsService);
        when(ttsService.synthesizeStream("你好")).thenReturn(Flux.just(new byte[] {1}, new byte[] {2}));

        List<byte[]> chunks = adapter.synthesizeStream("你好").collectList().block();

        assertEquals(2, chunks.size());
        assertArrayEquals(new byte[] {1}, chunks.get(0));
        assertArrayEquals(new byte[] {2}, chunks.get(1));
    }
}
