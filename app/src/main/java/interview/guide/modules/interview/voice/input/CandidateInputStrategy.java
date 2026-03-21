package interview.guide.modules.interview.voice.input;

import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;

/**
 * 候选人输入策略。
 *
 * 负责把不同来源的输入统一标准化成可提交的答案文本。
 */
public interface CandidateInputStrategy {

    CandidateInputMode getMode();

    NormalizedAnswer normalize(InterviewTurnInput input);
}
