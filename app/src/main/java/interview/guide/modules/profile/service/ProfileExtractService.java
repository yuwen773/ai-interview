package interview.guide.modules.profile.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewAnswerEntity;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 画像提取服务
 * 使用 LLM 从面试会话的问答记录中提取弱项洞察和强项洞察
 */
@Service
public class ProfileExtractService {

    private static final Logger log = LoggerFactory.getLogger(ProfileExtractService.class);

    private final ChatClient chatClient;
    private final StructuredOutputInvoker structuredOutputInvoker;
    private final InterviewSessionRepository sessionRepo;
    private final UserWeakPointRepository weakPointRepo;
    private final PromptTemplate userPromptTemplate;
    private final String systemPromptTemplate;
    private final BeanOutputConverter<ProfileExtractResult> outputConverter;

    public ProfileExtractService(
            ChatClient.Builder chatClientBuilder,
            StructuredOutputInvoker structuredOutputInvoker,
            InterviewSessionRepository sessionRepo,
            UserWeakPointRepository weakPointRepo,
            @Value("classpath:prompts/profile-extract-system.st") Resource systemPromptResource,
            @Value("classpath:prompts/profile-extract-user.st") Resource userPromptResource) throws Exception {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.sessionRepo = sessionRepo;
        this.weakPointRepo = weakPointRepo;
        this.systemPromptTemplate = systemPromptResource.getContentAsString(StandardCharsets.UTF_8);
        this.userPromptTemplate = new PromptTemplate(userPromptResource.getContentAsString(StandardCharsets.UTF_8));
        this.outputConverter = new BeanOutputConverter<>(ProfileExtractResult.class);
    }

    /** 从面试会话中提取画像（不传入userId，不加载已有弱项） */
    public ProfileExtractResult extractFromSession(Long sessionId) {
        return extractFromSession(sessionId, null);
    }

    /**
     * 从面试会话中提取画像洞察
     *
     * @param sessionId 面试会话ID
     * @param userId    用户ID，非空时将已有弱项信息传递给LLM以辅助提取
     * @return 提取的弱项和强项列表
     */
    public ProfileExtractResult extractFromSession(Long sessionId, String userId) {
        InterviewSessionEntity session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_SESSION_NOT_FOUND,
                "Interview session not found: " + sessionId));

        List<InterviewAnswerEntity> answers = session.getAnswers();
        String jobRole = session.getJobLabelSnapshot() != null
            ? session.getJobLabelSnapshot()
            : (session.getJobRole() != null ? session.getJobRole().name() : "未知岗位");

        String answersText = buildAnswersText(answers);
        String existingWeakPoints = userId != null ? buildExistingWeakPointsText(userId) : "无";

        String systemPrompt = systemPromptTemplate;
        String userPrompt = userPromptTemplate.render(Map.of(
            "jobRole", jobRole,
            "answers", answersText,
            "existingWeakPoints", existingWeakPoints
        ));

        String systemPromptWithFormat = systemPrompt + "\n\n" + outputConverter.getFormat();

        return structuredOutputInvoker.invoke(
            chatClient,
            systemPromptWithFormat,
            userPrompt,
            outputConverter,
            ErrorCode.PROFILE_EXTRACTION_FAILED,
            "Profile extraction failed: ",
            "ProfileExtract",
            log
        );
    }

    /** 构建已有弱项文本，传递给LLM作为参考上下文 */
    private String buildExistingWeakPointsText(String userId) {
        return formatWeakPointsForPrompt(weakPointRepo.findByUserIdAndIsImprovedFalse(userId));
    }

    /** 将弱项列表格式化为带索引的文本，供Prompt使用 */
    static String formatWeakPointsForPrompt(List<UserWeakPointEntity> weakPoints) {
        if (weakPoints.isEmpty()) return "无";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < weakPoints.size(); i++) {
            UserWeakPointEntity wp = weakPoints.get(i);
            sb.append("[").append(i).append("] ").append(wp.getTopic())
              .append(" - ").append(wp.getQuestionText())
              .append(" (已观察").append(wp.getTimesSeen()).append("次)\n");
        }
        return sb.toString();
    }

    /** 将面试问答记录格式化为文本，限制最大字符数避免超出Token限制 */
    private String buildAnswersText(List<InterviewAnswerEntity> answers) {
        StringBuilder sb = new StringBuilder();
        int maxChars = 4000;
        int index = 1;
        int totalAnswered = 0;
        for (InterviewAnswerEntity answer : answers) {
            if (sb.length() > maxChars) break;
            String userAnswer = answer.getUserAnswer() != null ? answer.getUserAnswer() : "(无回答)";
            Integer score = answer.getScore();
            sb.append("Q").append(index).append(": ").append(answer.getQuestion()).append("\n");
            String truncated = userAnswer.length() > 500
                ? userAnswer.substring(0, 500) + "..."
                : userAnswer;
            sb.append("A: ").append(truncated).append("\n");
            sb.append("评估得分: ").append(score != null ? score : "N/A").append("/10\n");
            sb.append("---\n");
            index++;
            totalAnswered++;
        }
        if (totalAnswered < answers.size()) {
            sb.append("(...省略了").append(answers.size() - totalAnswered).append("道题)\n");
        }
        return sb.toString();
    }
}
