package interview.guide.modules.interview.service.strategy;

import interview.guide.modules.interview.model.InterviewQuestionDTO.QuestionType;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionBucket;
import interview.guide.modules.interview.model.QuestionPlan;
import interview.guide.modules.interview.service.InterviewJobStrategy;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebFrontendStrategy implements InterviewJobStrategy {

    @Override
    public JobRole getJobRole() {
        return JobRole.WEB_FRONTEND;
    }

    @Override
    public QuestionPlan buildQuestionPlan(int questionCount) {
        return new QuestionPlan(
            List.of(
                new QuestionBucket(QuestionType.PROJECT, "项目经历", 2, 1, List.of("业务场景", "性能优化", "协作")),
                new QuestionBucket(QuestionType.JAVASCRIPT_TYPESCRIPT, "JavaScript/TypeScript", 2, 2, List.of("闭包", "原型链", "类型系统")),
                new QuestionBucket(QuestionType.REACT, "React", 2, 3, List.of("状态管理", "渲染机制", "Hooks")),
                new QuestionBucket(QuestionType.BROWSER_NETWORK, "浏览器与网络", 2, 4, List.of("渲染流程", "缓存", "HTTP")),
                new QuestionBucket(QuestionType.CSS_HTML, "CSS/HTML", 1, 5, List.of("布局", "响应式", "语义化")),
                new QuestionBucket(QuestionType.ENGINEERING, "前端工程化", Math.max(1, questionCount - 9), 6, List.of("构建", "测试", "监控", "发布"))
            ),
            List.of("项目经验", "JavaScript/TypeScript", "React", "浏览器与网络", "工程化"),
            "重点追问候选人在真实前端项目中的状态管理、性能优化、浏览器机制与工程化实践，避免脱离简历空泛出题。"
        ).trimTo(questionCount);
    }
}
