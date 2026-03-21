package interview.guide.modules.audio.adapter;

import interview.guide.modules.audio.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component
@RequiredArgsConstructor
public class DefaultTtsAdapter implements TtsAdapter {

    // 统一收口 TTS 能力，避免业务层直接依赖底层语音实现。
    private final TtsService ttsService;

    @Override
    public byte[] synthesize(String text) {
        return ttsService.synthesize(text);
    }

    @Override
    public Flux<byte[]> synthesizeStream(String text) {
        return ttsService.synthesizeStream(text);
    }
}
