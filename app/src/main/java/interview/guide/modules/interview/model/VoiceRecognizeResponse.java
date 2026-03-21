package interview.guide.modules.interview.model;

/**
 * 语音识别接口响应。
 *
 * 该接口只返回识别文本，不推进面试会话，供前端人工复查后再提交。
 *
 * @param recognizedText 识别出的文本内容
 */
public record VoiceRecognizeResponse(
    String recognizedText
) {
}
