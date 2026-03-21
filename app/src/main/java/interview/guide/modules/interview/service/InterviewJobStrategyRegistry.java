package interview.guide.modules.interview.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionPlan;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 岗位策略注册表
 */
@Component
public class InterviewJobStrategyRegistry {

    private final Map<JobRole, InterviewJobStrategy> strategies;

    public InterviewJobStrategyRegistry(java.util.List<InterviewJobStrategy> strategies) {
        this.strategies = strategies.stream()
            .collect(Collectors.toMap(InterviewJobStrategy::getJobRole, Function.identity()));
    }

    public QuestionPlan getQuestionPlan(JobRole jobRole, int questionCount) {
        if (jobRole == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "岗位不能为空");
        }
        InterviewJobStrategy strategy = strategies.get(jobRole);
        if (strategy == null) {
            throw new BusinessException(
                ErrorCode.BAD_REQUEST,
                "不支持的岗位: " + jobRole + "，当前支持: " + Arrays.toString(JobRole.values())
            );
        }
        return strategy.buildQuestionPlan(questionCount).trimTo(questionCount);
    }
}
