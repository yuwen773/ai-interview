package interview.guide.modules.interview.voice.model;


/**
 * 标准化后的答案载体。
 *
 * 无论输入来自文本还是语音，最终都统一转换成这个结构再进入面试主流程。
 *
 * @param answerText 最终提交给面试主流程的答案文本
 * @param recognizedText 语音识别得到的原始文本，文本模式下通常为空
 * @param inputMode 当前答案的输入模式
 */
public record NormalizedAnswer(
    String answerText,
    String recognizedText,
    CandidateInputMode inputMode
) {
}
