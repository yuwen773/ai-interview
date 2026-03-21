package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionPlan;

/**
 * 不同岗位的出题规划策略
 */
public interface InterviewJobStrategy {

    JobRole getJobRole();

    QuestionPlan buildQuestionPlan(int questionCount);
}
