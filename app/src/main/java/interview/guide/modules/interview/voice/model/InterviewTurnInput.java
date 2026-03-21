package interview.guide.modules.interview.voice.model;

import org.springframework.web.multipart.MultipartFile;


/**
 * 一轮面试交互的输入模型。
 *
 * 同时承载文本答案、音频文件和输入/输出模式，供 processor 做统一编排。
 *
 * @param sessionId 会话 ID
 * @param questionIndex 当前问题索引
 * @param answerText 文本回答内容
 * @param audioFile 语音回答上传的音频文件
 * @param candidateInputMode 候选人输入模式
 * @param interviewerOutputMode 面试官输出模式
 */
public record InterviewTurnInput(
    String sessionId,
    Integer questionIndex,
    String answerText,
    MultipartFile audioFile,
    CandidateInputMode candidateInputMode,
    InterviewerOutputMode interviewerOutputMode
) {
}
