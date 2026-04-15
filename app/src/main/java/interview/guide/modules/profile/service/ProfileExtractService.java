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

    public ProfileExtractResult extractFromSession(Long sessionId) {
        InterviewSessionEntity session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_SESSION_NOT_FOUND, "Interview session not found: " + sessionId));

        List<InterviewAnswerEntity> answers = session.getAnswers();
        String jobRole = session.getJobLabelSnapshot() != null
            ? session.getJobLabelSnapshot()
            : (session.getJobRole() != null ? session.getJobRole().name() : "未知岗位");

        String answersText = buildAnswersText(answers);

        String systemPrompt = systemPromptTemplate;
        String userPrompt = userPromptTemplate.render(Map.of(
            "jobRole", jobRole,
            "answers", answersText,
            "existingWeakPoints", "无"
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

    public ProfileExtractResult extractFromSession(Long sessionId, String userId) {
        InterviewSessionEntity session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_SESSION_NOT_FOUND,
                "Interview session not found: " + sessionId));

        List<InterviewAnswerEntity> answers = session.getAnswers();
        String jobRole = session.getJobLabelSnapshot() != null
            ? session.getJobLabelSnapshot()
            : (session.getJobRole() != null ? session.getJobRole().name() : "未知岗位");

        String answersText = buildAnswersText(answers);
        String existingWeakPoints = buildExistingWeakPointsText(userId);

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

    private String buildExistingWeakPointsText(String userId) {
        List<UserWeakPointEntity> existing = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        if (existing.isEmpty()) {
            return "无";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < existing.size(); i++) {
            UserWeakPointEntity wp = existing.get(i);
            sb.append("[").append(i).append("] ").append(wp.getTopic())
              .append(" - ").append(wp.getQuestionText())
              .append(" (已观察").append(wp.getTimesSeen()).append("次)\n");
        }
        return sb.toString();
    }

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
