package interview.guide.modules.interview.voice.output;

import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;

/**
 * 面试官输出策略。
 *
 * 负责把现有 submitAnswer 结果包装成前端需要的统一响应结构。
 */
public interface InterviewerOutputStrategy {

    InterviewerOutputMode getMode();

    InterviewTurnResponse build(SubmitAnswerResponse submitAnswerResponse, String recognizedText);
}
