package interview.guide.modules.interview.model;

/**
 * 题目语音播报请求。
 *
 * @param text 需要合成的题目文本
 */
public record TtsStreamRequest(String text) {
}
