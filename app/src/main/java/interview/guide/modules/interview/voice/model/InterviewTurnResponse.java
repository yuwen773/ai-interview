package interview.guide.modules.interview.voice.model;

import interview.guide.modules.interview.model.InterviewQuestionDTO;

/**
 * 一轮面试交互的统一输出模型。
 *
 * 在原有 submitAnswer 结果外补充识别文本和面试官输出模式，供前端后续扩展语音体验。
 *
 * @param recognizedText 语音识别文本
 * @param hasNextQuestion 是否还有下一题
 * @param nextQuestion 下一题内容
 * @param currentQuestionIndex 当前题号指针
 * @param totalQuestions 总题数
 * @param interviewerOutputMode 面试官输出模式
 */
public record InterviewTurnResponse(
    String recognizedText,
    boolean hasNextQuestion,
    InterviewQuestionDTO nextQuestion,
    int currentQuestionIndex,
    int totalQuestions,
    InterviewerOutputMode interviewerOutputMode
) {
}
