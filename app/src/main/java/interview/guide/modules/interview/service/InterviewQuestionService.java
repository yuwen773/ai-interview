package interview.guide.modules.interview.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.InterviewQuestionDTO.QuestionType;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.QuestionBucket;
import interview.guide.modules.interview.model.QuestionPlan;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.service.UserProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 面试问题生成服务
 * 基于岗位策略和简历内容生成针对性的面试问题
 */
@Service
public class InterviewQuestionService {

    private static final Logger log = LoggerFactory.getLogger(InterviewQuestionService.class);
    private static final int MAX_FOLLOW_UP_COUNT = 2;

    private final ChatClient chatClient;
    private final PromptTemplate systemPromptTemplate;
    private final PromptTemplate userPromptTemplate;
    private final BeanOutputConverter<QuestionListDTO> outputConverter;
    private final StructuredOutputInvoker structuredOutputInvoker;
    private final InterviewJobStrategyRegistry strategyRegistry;
    private final int followUpCount;
    private final UserProfileService profileService;

    private record QuestionListDTO(
        List<QuestionDTO> questions
    ) {}

    private record QuestionDTO(
        String question,
        String type,
        String category,
        List<String> followUps
    ) {}

    @Autowired
    public InterviewQuestionService(
        ChatClient.Builder chatClientBuilder,
        InterviewJobStrategyRegistry strategyRegistry,
        StructuredOutputInvoker structuredOutputInvoker,
        UserProfileService profileService,
        @Value("classpath:prompts/interview-question-system.st") Resource systemPromptResource,
        @Value("classpath:prompts/interview-question-user.st") Resource userPromptResource,
        @Value("${app.interview.follow-up-count:1}") int followUpCount
    ) throws IOException {
        this.chatClient = chatClientBuilder.build();
        this.strategyRegistry = strategyRegistry;
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.profileService = profileService;
        this.systemPromptTemplate = new PromptTemplate(systemPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.userPromptTemplate = new PromptTemplate(userPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.outputConverter = new BeanOutputConverter<>(QuestionListDTO.class);
        this.followUpCount = Math.max(0, Math.min(followUpCount, MAX_FOLLOW_UP_COUNT));
    }

    public List<InterviewQuestionDTO> generateQuestions(
        JobRole jobRole,
        String resumeText,
        int questionCount,
        List<String> historicalQuestions
    ) {
        return generateQuestionsWithWeakContext(jobRole, resumeText, questionCount, historicalQuestions, "");
    }

    public List<InterviewQuestionDTO> generateQuestions(JobRole jobRole, String resumeText, int questionCount) {
        return generateQuestions(jobRole, resumeText, questionCount, null);
    }

    /**
     * 生成专项训练问题，注入用户历史弱项上下文
     */
    public List<InterviewQuestionDTO> generateTargetedQuestions(
        JobRole jobRole,
        String resumeText,
        int questionCount,
        String userId,
        String topic
    ) {
        log.info("开始生成专项训练问题，岗位: {}, 主题: {}, 简历长度: {}, 问题数量: {}",
            jobRole, topic, resumeText.length(), questionCount);

        // 获取到期弱项
        List<UserWeakPointEntity> dueReviews = profileService.getDueReviews(userId, topic);
        String weakContext = "";
        if (dueReviews != null && !dueReviews.isEmpty()) {
            weakContext = dueReviews.stream()
                .map(wp -> {
                    Map<String, Object> sr = wp.getSrState();
                    double ef = 2.5;
                    if (sr != null && sr.get("ease_factor") instanceof Number) {
                        ef = ((Number) sr.get("ease_factor")).doubleValue();
                    }
                    String topicStr = wp.getTopic() != null ? sanitizeForPrompt(wp.getTopic()) : "未知";
                    String questionStr = wp.getQuestionText() != null ? sanitizeForPrompt(wp.getQuestionText()) : "";
                    return String.format("- [%s] %s (暴露%d次, EF=%.1f)",
                        topicStr, questionStr,
                        wp.getTimesSeen() != null ? wp.getTimesSeen() : 1,
                        ef);
                })
                .collect(Collectors.joining("\n"));
            log.info("注入 {} 条历史弱项到专项训练题目生成", dueReviews.size());
        }

        // 调用原有生成逻辑，但注入弱项上下文
        return generateQuestionsWithWeakContext(jobRole, resumeText, questionCount, null, weakContext);
    }

    private List<InterviewQuestionDTO> generateQuestionsWithWeakContext(
        JobRole jobRole,
        String resumeText,
        int questionCount,
        List<String> historicalQuestions,
        String weakContext
    ) {
        log.info("开始生成面试问题，岗位: {}, 简历长度: {}, 问题数量: {}, 历史问题数: {}",
            jobRole, resumeText.length(), questionCount, historicalQuestions != null ? historicalQuestions.size() : 0);

        QuestionPlan questionPlan = strategyRegistry.getQuestionPlan(jobRole, questionCount);

        try {
            String systemPrompt = systemPromptTemplate.render();

            Map<String, Object> variables = new HashMap<>();
            variables.put("jobRole", jobRole.getCode());
            variables.put("jobLabel", jobRole.getLabel());
            variables.put("jobDescription", jobRole.getDescription());
            variables.put("techKeywords", String.join("、", jobRole.getTechKeywords()));
            variables.put("questionCount", questionCount);
            variables.put("focusAreas", buildFocusAreaText(questionPlan.focusAreas()));
            variables.put("questionPlan", buildQuestionPlanText(questionPlan.buckets()));
            variables.put("promptHint", questionPlan.promptHint());
            variables.put("questionTypes", buildQuestionTypeText());
            variables.put("followUpCount", followUpCount);
            variables.put("resumeText", resumeText);
            if (historicalQuestions != null && !historicalQuestions.isEmpty()) {
                variables.put("historicalQuestions", String.join("\n", historicalQuestions));
            } else {
                variables.put("historicalQuestions", "暂无历史提问");
            }

            // 注入弱项上下文
            if (weakContext != null && !weakContext.isEmpty()) {
                variables.put("weakPointContext", "\n\n历史弱项（优先考察）：\n" + weakContext);
            } else {
                variables.put("weakPointContext", "");
            }

            String userPrompt = userPromptTemplate.render(variables);
            String systemPromptWithFormat = systemPrompt + "\n\n" + outputConverter.getFormat();

            QuestionListDTO dto = structuredOutputInvoker.invoke(
                chatClient,
                systemPromptWithFormat,
                userPrompt,
                outputConverter,
                ErrorCode.INTERVIEW_QUESTION_GENERATION_FAILED,
                "面试问题生成失败：",
                "结构化问题生成",
                log
            );
            log.debug("AI响应解析成功: questions count={}", dto.questions().size());

            List<InterviewQuestionDTO> questions = convertToQuestions(dto);
            log.info("成功生成 {} 个面试问题", questions.size());
            return questions;
        } catch (Exception e) {
            log.error("生成面试问题失败: {}", e.getMessage(), e);
            return generateDefaultQuestions(jobRole, questionCount);
        }
    }

    private List<InterviewQuestionDTO> convertToQuestions(QuestionListDTO dto) {
        List<InterviewQuestionDTO> questions = new ArrayList<>();
        int index = 0;

        if (dto == null || dto.questions() == null) {
            return questions;
        }

        for (QuestionDTO q : dto.questions()) {
            if (q == null || q.question() == null || q.question().isBlank()) {
                continue;
            }
            QuestionType type = parseQuestionType(q.type());
            int mainQuestionIndex = index;
            questions.add(InterviewQuestionDTO.create(index++, q.question(), type, q.category(), false, null));

            List<String> followUps = sanitizeFollowUps(q.followUps());
            for (int i = 0; i < followUps.size(); i++) {
                questions.add(InterviewQuestionDTO.create(
                    index++,
                    followUps.get(i),
                    type,
                    buildFollowUpCategory(q.category(), i + 1),
                    true,
                    mainQuestionIndex
                ));
            }
        }

        return questions;
    }

    private QuestionType parseQuestionType(String typeStr) {
        try {
            return QuestionType.valueOf(typeStr.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return QuestionType.GENERAL;
        }
    }

    private List<InterviewQuestionDTO> generateDefaultQuestions(JobRole jobRole, int count) {
        List<InterviewQuestionDTO> questions = new ArrayList<>();
        String[][] defaults = switch (jobRole) {
            case WEB_FRONTEND -> new String[][] {
                {"请介绍一个你在简历中负责最深的前端项目，以及你解决过的最棘手问题。", "PROJECT", "项目经历"},
                {"JavaScript 闭包的本质是什么？在实际项目中你如何避免闭包带来的状态问题？", "JAVASCRIPT_TYPESCRIPT", "JavaScript/TypeScript"},
                {"React 中一次状态更新为什么会触发重新渲染？你做过哪些渲染优化？", "REACT", "React"},
                {"浏览器从输入 URL 到页面渲染完成，关键流程有哪些？", "BROWSER_NETWORK", "浏览器与网络"},
                {"Flex 和 Grid 各适合解决什么布局问题？你在移动端适配时怎么取舍？", "CSS_HTML", "CSS/HTML"},
                {"前端构建产物过大时，你通常如何定位并优化？", "ENGINEERING", "前端工程化"},
                {"TypeScript 中 interface 和 type 的核心差异是什么？", "JAVASCRIPT_TYPESCRIPT", "JavaScript/TypeScript"},
                {"React Hook 为什么要求调用顺序稳定？", "REACT", "React"},
                {"浏览器缓存有哪些层级？协商缓存和强缓存如何配合？", "BROWSER_NETWORK", "浏览器与网络"},
                {"你如何设计前端监控来定位线上白屏或接口异常？", "ENGINEERING", "前端工程化"},
            };
            case PYTHON_ALGORITHM -> new String[][] {
                {"请介绍一个你在简历中做过的算法或数据处理项目，重点说明你的建模思路。", "PROJECT", "项目经历"},
                {"请比较常见排序算法的时间复杂度、稳定性以及适用场景。", "ALGORITHM_DATA_STRUCTURE", "算法与数据结构"},
                {"动态规划问题通常如何定义状态与转移？", "ALGORITHM_DATA_STRUCTURE", "算法与数据结构"},
                {"Python 生成器和迭代器的区别是什么？", "PYTHON_CORE", "Python 核心"},
                {"Python 中深拷贝与浅拷贝的差异是什么？", "PYTHON_CORE", "Python 核心"},
                {"如果一个算法在线上运行超时，你通常如何定位瓶颈并优化？", "ENGINEERING", "算法工程化"},
                {"哈希表与平衡树在查找问题上的适用边界是什么？", "ALGORITHM_DATA_STRUCTURE", "算法与数据结构"},
                {"Python 装饰器的实现原理是什么？", "PYTHON_CORE", "Python 核心"},
                {"如果需要把算法服务化，你会如何设计测试与观测指标？", "ENGINEERING", "算法工程化"},
                {"面对边界条件很多的题目，你如何验证解法的正确性？", "GENERAL", "问题分析"},
            };
            case JAVA_BACKEND -> new String[][] {
                {"请介绍一下你在简历中提到的最重要的项目，你在其中承担了什么角色？", "PROJECT", "项目经历"},
                {"MySQL 的索引有哪些类型？B+ 树索引的原理是什么？", "MYSQL", "MySQL"},
                {"Redis 支持哪些数据结构？各自的使用场景是什么？", "REDIS", "Redis"},
                {"Java 中 HashMap 的底层实现原理是什么？JDK8 做了哪些优化？", "JAVA_COLLECTION", "Java 集合"},
                {"synchronized 和 ReentrantLock 有什么区别？", "JAVA_CONCURRENT", "Java 并发"},
                {"Spring 的 IoC 和 AOP 原理是什么？", "SPRING", "Spring"},
                {"MySQL 事务的 ACID 特性是什么？隔离级别有哪些？", "MYSQL", "MySQL"},
                {"Redis 的持久化机制有哪些？RDB 和 AOF 的区别？", "REDIS", "Redis"},
                {"Java 的垃圾回收机制是怎样的？常见的 GC 算法有哪些？", "JAVA_BASIC", "Java 基础"},
                {"线程池的核心参数有哪些？如何合理配置？", "JAVA_CONCURRENT", "Java 并发"},
            };
        };

        int index = 0;
        for (int i = 0; i < Math.min(count, defaults.length); i++) {
            String mainQuestion = defaults[i][0];
            QuestionType type = QuestionType.valueOf(defaults[i][1]);
            String category = defaults[i][2];
            questions.add(InterviewQuestionDTO.create(index++, mainQuestion, type, category, false, null));

            int mainQuestionIndex = index - 1;
            for (int j = 0; j < followUpCount; j++) {
                questions.add(InterviewQuestionDTO.create(
                    index++,
                    buildDefaultFollowUp(mainQuestion, j + 1),
                    type,
                    buildFollowUpCategory(category, j + 1),
                    true,
                    mainQuestionIndex
                ));
            }
        }

        return questions;
    }

    private List<String> sanitizeFollowUps(List<String> followUps) {
        if (followUpCount == 0 || followUps == null || followUps.isEmpty()) {
            return List.of();
        }
        return followUps.stream()
            .filter(item -> item != null && !item.isBlank())
            .map(String::trim)
            .limit(followUpCount)
            .collect(Collectors.toList());
    }

    private String buildFollowUpCategory(String category, int order) {
        String baseCategory = (category == null || category.isBlank()) ? "追问" : category;
        return baseCategory + "（追问" + order + "）";
    }

    private String buildDefaultFollowUp(String mainQuestion, int order) {
        if (order == 1) {
            return "基于\u201c" + mainQuestion + "\u201d，请结合你亲自做过的一个真实场景展开说明。";
        }
        return "基于\u201c" + mainQuestion + "\u201d，如果线上出现异常，你会如何定位并给出修复方案？";
    }

    private String buildFocusAreaText(List<String> focusAreas) {
        return focusAreas == null || focusAreas.isEmpty()
            ? "无"
            : String.join("、", focusAreas);
    }

    private String buildQuestionPlanText(List<QuestionBucket> buckets) {
        if (buckets == null || buckets.isEmpty()) {
            return "无";
        }
        return buckets.stream()
            .map(bucket -> String.format(
                "- %s | type=%s | count=%d | priority=%d | keywords=%s",
                bucket.category(),
                bucket.type().name(),
                bucket.count(),
                bucket.priority(),
                String.join("、", bucket.keywords())
            ))
            .collect(Collectors.joining("\n"));
    }

    private String buildQuestionTypeText() {
        return Arrays.stream(QuestionType.values())
            .map(Enum::name)
            .collect(Collectors.joining(", "));
    }

    /**
     * Sanitize user-controlled text for safe insertion into AI prompts.
     * Prevents prompt injection by escaping special characters.
     */
    private String sanitizeForPrompt(String input) {
        if (input == null) return "";
        // Remove newlines and limit length to prevent prompt injection
        String sanitized = input.replaceAll("[\\r\\n]+", " ").trim();
        if (sanitized.length() > 500) {
            sanitized = sanitized.substring(0, 500) + "...";
        }
        return sanitized;
    }
}
