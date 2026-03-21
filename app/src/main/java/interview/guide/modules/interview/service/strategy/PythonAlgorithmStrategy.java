package interview.guide.modules.interview.service.strategy;

import interview.guide.modules.interview.model.InterviewQuestionDTO.QuestionType;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionBucket;
import interview.guide.modules.interview.model.QuestionPlan;
import interview.guide.modules.interview.service.InterviewJobStrategy;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PythonAlgorithmStrategy implements InterviewJobStrategy {

    @Override
    public JobRole getJobRole() {
        return JobRole.PYTHON_ALGORITHM;
    }

    @Override
    public QuestionPlan buildQuestionPlan(int questionCount) {
        return new QuestionPlan(
            List.of(
                new QuestionBucket(QuestionType.PROJECT, "项目经历", 2, 1, List.of("建模", "数据处理", "工程落地")),
                new QuestionBucket(QuestionType.ALGORITHM_DATA_STRUCTURE, "算法与数据结构", 3, 2, List.of("动态规划", "图", "贪心", "复杂度")),
                new QuestionBucket(QuestionType.PYTHON_CORE, "Python 核心", 2, 3, List.of("迭代器", "生成器", "装饰器", "内存模型")),
                new QuestionBucket(QuestionType.ENGINEERING, "算法工程化", 2, 4, List.of("性能优化", "测试", "服务化", "可观测性")),
                new QuestionBucket(QuestionType.GENERAL, "问题分析", Math.max(1, questionCount - 9), 5, List.of("边界条件", "方案权衡", "鲁棒性"))
            ),
            List.of("项目经验", "算法设计", "Python 语言特性", "工程实现"),
            "优先从候选人实际做过的算法项目、题解思路和复杂度权衡切入，再追问 Python 实现细节与工程落地能力。"
        ).trimTo(questionCount);
    }
}
