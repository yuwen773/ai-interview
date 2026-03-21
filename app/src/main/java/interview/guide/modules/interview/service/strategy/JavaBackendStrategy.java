package interview.guide.modules.interview.service.strategy;

import interview.guide.modules.interview.model.InterviewQuestionDTO.QuestionType;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionBucket;
import interview.guide.modules.interview.model.QuestionPlan;
import interview.guide.modules.interview.service.InterviewJobStrategy;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JavaBackendStrategy implements InterviewJobStrategy {

    @Override
    public JobRole getJobRole() {
        return JobRole.JAVA_BACKEND;
    }

    @Override
    public QuestionPlan buildQuestionPlan(int questionCount) {
        return new QuestionPlan(
            List.of(
                new QuestionBucket(QuestionType.PROJECT, "项目经历", 2, 1, List.of("项目", "架构", "业务")),
                new QuestionBucket(QuestionType.MYSQL, "MySQL", 2, 2, List.of("索引", "事务", "SQL 优化")),
                new QuestionBucket(QuestionType.REDIS, "Redis", 2, 3, List.of("缓存", "持久化", "分布式锁")),
                new QuestionBucket(QuestionType.JAVA_BASIC, "Java 基础", 1, 4, List.of("JVM", "异常", "内存模型")),
                new QuestionBucket(QuestionType.JAVA_COLLECTION, "Java 集合", 1, 5, List.of("HashMap", "ConcurrentHashMap")),
                new QuestionBucket(QuestionType.JAVA_CONCURRENT, "Java 并发", 1, 6, List.of("线程池", "锁", "并发安全")),
                new QuestionBucket(QuestionType.SPRING, "Spring/Spring Boot", Math.max(1, questionCount - 9), 7, List.of("IoC", "AOP", "自动配置"))
            ),
            List.of("项目经验", "Java 核心", "数据库与缓存", "Spring 体系"),
            "优先围绕候选人在简历中真实使用过的后端技术展开，从业务场景追问到底层原理、性能优化与故障处理。"
        ).trimTo(questionCount);
    }
}
