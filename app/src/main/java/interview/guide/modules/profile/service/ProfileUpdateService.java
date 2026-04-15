package interview.guide.modules.profile.service;

import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.profile.entity.UserStrongPointEntity;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.model.dto.ProfileUpdateResult;
import interview.guide.modules.profile.repository.UserStrongPointRepository;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ProfileUpdateService {

    private static final Logger log = LoggerFactory.getLogger(ProfileUpdateService.class);

    private final ChatClient chatClient;
    private final StructuredOutputInvoker structuredOutputInvoker;
    private final UserWeakPointRepository weakPointRepo;
    private final UserStrongPointRepository strongPointRepo;
    private final PromptTemplate updatePromptTemplate;
    private final BeanOutputConverter<ProfileUpdateResult> outputConverter;

    public ProfileUpdateService(
            ChatClient.Builder chatClientBuilder,
            StructuredOutputInvoker structuredOutputInvoker,
            UserWeakPointRepository weakPointRepo,
            UserStrongPointRepository strongPointRepo,
            @Value("classpath:prompts/profile-update-system.st") Resource promptResource) throws Exception {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.weakPointRepo = weakPointRepo;
        this.strongPointRepo = strongPointRepo;
        this.updatePromptTemplate = new PromptTemplate(promptResource.getContentAsString(StandardCharsets.UTF_8));
        this.outputConverter = new BeanOutputConverter<>(ProfileUpdateResult.class);
    }

    public ProfileUpdateResult decideUpdates(String userId, ProfileExtractResult extraction) {
        List<UserWeakPointEntity> existingWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        List<UserStrongPointEntity> existingStrong = strongPointRepo.findByUserId(userId);

        String userPrompt = updatePromptTemplate.render(Map.of(
            "existingWeakPoints", ProfileExtractService.formatWeakPointsForPrompt(existingWeak),
            "existingStrongPoints", formatExistingStrongPoints(existingStrong),
            "newWeakPoints", formatNewWeakPoints(extraction.weakPoints()),
            "newStrongPoints", formatNewStrongPoints(extraction.strengths())
        ));

        String systemPromptWithFormat = outputConverter.getFormat();

        return structuredOutputInvoker.invoke(
            chatClient,
            systemPromptWithFormat,
            userPrompt,
            outputConverter,
            ErrorCode.PROFILE_UPDATE_FAILED,
            "Profile update decision failed: ",
            "ProfileUpdate",
            log
        );
    }

    @Transactional
    public void applyOperations(String userId, ProfileUpdateResult result, Long sessionId) {
        List<UserWeakPointEntity> existingWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);

        for (ProfileUpdateResult.WeakPointOp op : result.weakPointOps()) {
            switch (op.action()) {
                case "ADD" -> applyWeakAdd(userId, op, sessionId);
                case "UPDATE" -> applyWeakUpdate(existingWeak, op);
                default -> log.debug("Weak point NOOP: {}", op.reason());
            }
        }

        for (ProfileUpdateResult.StrongPointOp op : result.strongPointOps()) {
            switch (op.action()) {
                case "ADD" -> applyStrongAdd(userId, op, sessionId);
                default -> log.debug("Strong point NOOP: {}", op.reason());
            }
        }

        for (ProfileUpdateResult.ImprovementOp imp : result.improvements()) {
            if (imp.weakIndex() >= 0 && imp.weakIndex() < existingWeak.size()) {
                applyImprove(existingWeak.get(imp.weakIndex()), imp.reason());
            } else {
                log.warn("Improvement index out of bounds: {}", imp.weakIndex());
            }
        }
    }

    @Transactional
    public void applyFallback(String userId, ProfileExtractResult extraction, Long sessionId) {
        log.info("Using fallback rule-based profile update for user: {}", userId);
        List<UserWeakPointEntity> existingWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        Map<String, UserWeakPointEntity> weakByText = new HashMap<>();
        for (UserWeakPointEntity e : existingWeak) {
            weakByText.put(e.getQuestionText(), e);
        }

        for (var weak : extraction.weakPoints()) {
            UserWeakPointEntity existing = weakByText.get(weak.question());
            if (existing != null) {
                existing.setTimesSeen(existing.getTimesSeen() + 1);
                existing.setLastSeen(LocalDateTime.now());
                weakPointRepo.save(existing);
                log.debug("Updated timesSeen for existing weak point: {}", weak.question());
            } else {
                UserWeakPointEntity entity = new UserWeakPointEntity();
                entity.setUserId(userId);
                entity.setTopic(weak.topic());
                entity.setQuestionText(weak.question());
                entity.setAnswerSummary(weak.answerSummary());
                entity.setScore(BigDecimal.valueOf(weak.score()));
                entity.setSource("INTERVIEW");
                entity.setSessionId(sessionId);
                entity.setSrState(SpacedRepetitionService.buildInitialSrState(weak.score()));
                weakPointRepo.save(entity);
            }
        }

        for (var strong : extraction.strengths()) {
            UserStrongPointEntity entity = new UserStrongPointEntity();
            entity.setUserId(userId);
            entity.setTopic(strong.topic());
            entity.setDescription(strong.description());
            entity.setSource("INTERVIEW");
            entity.setSessionId(sessionId);
            strongPointRepo.save(entity);
        }
    }

    private void applyWeakAdd(String userId, ProfileUpdateResult.WeakPointOp op, Long sessionId) {
        UserWeakPointEntity entity = new UserWeakPointEntity();
        entity.setUserId(userId);
        entity.setTopic(op.topic());
        entity.setQuestionText(op.point());
        entity.setAnswerSummary(op.answerSummary());
        entity.setScore(op.score() != null ? BigDecimal.valueOf(op.score()) : null);
        entity.setSource("INTERVIEW");
        entity.setSessionId(sessionId);
        entity.setSrState(SpacedRepetitionService.buildInitialSrState(op.score() != null ? op.score() : 5.0));
        weakPointRepo.save(entity);
        log.info("ADD weak point: {} - {}", op.topic(), op.point());
    }

    private void applyWeakUpdate(List<UserWeakPointEntity> existing, ProfileUpdateResult.WeakPointOp op) {
        if (op.index() == null || op.index() < 0 || op.index() >= existing.size()) {
            log.warn("UPDATE index out of bounds: {}", op.index());
            return;
        }
        UserWeakPointEntity entity = existing.get(op.index());
        List<Map<String, String>> history = entity.getHistory();
        if (history == null) history = new ArrayList<>();
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("action", "UPDATE");
        entry.put("from", entity.getQuestionText());
        entry.put("to", op.newPoint());
        entry.put("at", LocalDateTime.now().toString());
        history.add(entry);
        entity.setHistory(history);
        entity.setQuestionText(op.newPoint());
        if (op.newAnswerSummary() != null) {
            entity.setAnswerSummary(op.newAnswerSummary());
        }
        entity.setTimesSeen(entity.getTimesSeen() + 1);
        entity.setLastSeen(LocalDateTime.now());
        entity.setSrState(SpacedRepetitionService.buildInitialSrState(5.0));
        weakPointRepo.save(entity);
        log.info("UPDATE weak point [{}]: {} -> {}", op.index(), entry.get("from"), op.newPoint());
    }

    private void applyStrongAdd(String userId, ProfileUpdateResult.StrongPointOp op, Long sessionId) {
        UserStrongPointEntity entity = new UserStrongPointEntity();
        entity.setUserId(userId);
        entity.setTopic(op.topic());
        entity.setDescription(op.point());
        entity.setSource("INTERVIEW");
        entity.setSessionId(sessionId);
        strongPointRepo.save(entity);
        log.info("ADD strong point: {} - {}", op.topic(), op.point());
    }

    private void applyImprove(UserWeakPointEntity entity, String reason) {
        List<Map<String, String>> history = entity.getHistory();
        if (history == null) history = new ArrayList<>();
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("action", "IMPROVE");
        entry.put("reason", reason);
        entry.put("at", LocalDateTime.now().toString());
        history.add(entry);
        entity.setHistory(history);
        entity.setImproved(true);
        entity.setImprovedAt(LocalDateTime.now());
        weakPointRepo.save(entity);
        log.info("IMPROVE weak point: {} - reason: {}", entity.getQuestionText(), reason);
    }

    private String formatExistingStrongPoints(List<UserStrongPointEntity> strongPoints) {
        if (strongPoints.isEmpty()) return "无";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < strongPoints.size(); i++) {
            UserStrongPointEntity sp = strongPoints.get(i);
            sb.append("[").append(i).append("] ").append(sp.getTopic())
              .append(" - ").append(sp.getDescription()).append("\n");
        }
        return sb.toString();
    }

    private String formatNewWeakPoints(List<ProfileExtractResult.WeakPointInsight> weakPoints) {
        if (weakPoints == null || weakPoints.isEmpty()) return "无";
        StringBuilder sb = new StringBuilder();
        for (var wp : weakPoints) {
            sb.append("- [").append(wp.topic()).append("] ").append(wp.question())
              .append(" (得分: ").append(wp.score()).append("/10)")
              .append("\n  应答参考: ").append(wp.answerSummary()).append("\n");
        }
        return sb.toString();
    }

    private String formatNewStrongPoints(List<ProfileExtractResult.StrengthInsight> strongPoints) {
        if (strongPoints == null || strongPoints.isEmpty()) return "无";
        StringBuilder sb = new StringBuilder();
        for (var sp : strongPoints) {
            sb.append("- [").append(sp.topic()).append("] ").append(sp.description()).append("\n");
        }
        return sb.toString();
    }
}
