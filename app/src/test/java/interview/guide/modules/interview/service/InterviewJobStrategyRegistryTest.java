package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionPlan;
import interview.guide.modules.interview.service.strategy.JavaBackendStrategy;
import interview.guide.modules.interview.service.strategy.PythonAlgorithmStrategy;
import interview.guide.modules.interview.service.strategy.WebFrontendStrategy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("岗位策略注册表测试")
class InterviewJobStrategyRegistryTest {

    @Test
    @DisplayName("当题目数不足时应按优先级裁剪规划桶")
    void shouldTrimQuestionPlanByPriority() {
        InterviewJobStrategyRegistry registry = new InterviewJobStrategyRegistry(
            java.util.List.of(
                new JavaBackendStrategy(),
                new WebFrontendStrategy(),
                new PythonAlgorithmStrategy()
            )
        );

        QuestionPlan plan = registry.getQuestionPlan(JobRole.WEB_FRONTEND, 3);

        assertEquals(3, plan.buckets().stream().mapToInt(bucket -> bucket.count()).sum());
        assertEquals("项目经历", plan.buckets().get(0).category());
        assertEquals(2, plan.buckets().get(0).count());
        assertEquals("JavaScript/TypeScript", plan.buckets().get(1).category());
        assertEquals(1, plan.buckets().get(1).count());
        assertTrue(plan.focusAreas().contains("React"));
    }
}
