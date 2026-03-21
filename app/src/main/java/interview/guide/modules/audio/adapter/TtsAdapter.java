package interview.guide.modules.audio.adapter;

import reactor.core.publisher.Flux;

/**
 * 语音合成适配层接口。
 *
 * 同时抽象一次性合成和流式合成，方便后续扩展播放能力。
 */
public interface TtsAdapter {

    byte[] synthesize(String text);

    Flux<byte[]> synthesizeStream(String text);
}
