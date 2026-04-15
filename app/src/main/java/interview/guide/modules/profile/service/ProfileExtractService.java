package interview.guide.modules.profile.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewAnswerEntity;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ProfileExtractService {

    private static final Logger log = LoggerFactory.getLogger(ProfileExtractService.class);

    private final ChatClient chatClient;
    private final StructuredOutputInvoker structuredOutputInvoker;
    private final InterviewSessionRepository sessionRepo;
    private final String systemPromptTemplate;
    private final String userPromptTemplate;
    private final BeanOutputConverter<ProfileExtractResult> outputConverter;

    public ProfileExtractService(
            ChatClient.Builder chatClientBuilder,
            StructuredOutputInvoker structuredOutputInvoker,
            InterviewSessionRepository sessionRepo,
            @Value("classpath:prompts/profile-extract-system.st") Resource systemPromptResource,
            @Value("classpath:prompts/profile-extract-user.st") Resource userPromptResource) throws Exception {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.sessionRepo = sessionRepo;
        this.systemPromptTemplate = StreamUtils.copyToString(systemPromptResource.getInputStream(), StandardCharsets.UTF_8);
        this.userPromptTemplate = StreamUtils.copyToString(userPromptResource.getInputStream(), StandardCharsets.UTF_8);
        this.outputConverter = new BeanOutputConverter<>(ProfileExtractResult.class);
    }

    public ProfileExtractResult extractFromSession(Long sessionId) {
        InterviewSessionEntity session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Interview session not found: " + sessionId));

        List<InterviewAnswerEntity> answers = session.getAnswers();
        String jobRole = session.getJobLabelSnapshot() != null
            ? session.getJobLabelSnapshot()
            : (session.getJobRole() != null ? session.getJobRole().name() : "未知岗位");

        // Build answers string for user prompt
        StringBuilder answersSb = new StringBuilder();
        int index = 1;
        for (InterviewAnswerEntity answer : answers) {
            String question = answer.getQuestion();
            String userAnswer = answer.getUserAnswer() != null ? answer.getUserAnswer() : "(无回答)";
            Integer score = answer.getScore();
            answersSb.append("Q").append(index).append(": ").append(question).append("\n");
            answersSb.append("A: ").append(userAnswer).append("\n");
            answersSb.append("评估得分: ").append(score != null ? score : "N/A").append("/10\n");
            answersSb.append("---\n");
            index++;
        }
        String answersText = answersSb.toString();

        String systemPrompt = systemPromptTemplate;
        String userPrompt = userPromptTemplate
            .replace("{jobRole}", jobRole)
            .replace("{answers}", answersText);

        String systemPromptWithFormat = systemPrompt + "\n\n" + outputConverter.getFormat();

        return structuredOutputInvoker.invoke(
            chatClient,
            systemPromptWithFormat,
            userPrompt,
            outputConverter,
            ErrorCode.INTERNAL_ERROR,
            "Profile extraction failed: ",
            "ProfileExtract",
            log
        );
    }
}
