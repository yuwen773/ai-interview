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
    private final ProfileSemanticService semanticService;
    private final PromptTemplate updatePromptTemplate;
    private final BeanOutputConverter<ProfileUpdateResult> outputConverter;

    public ProfileUpdateService(
            ChatClient.Builder chatClientBuilder,
            StructuredOutputInvoker structuredOutputInvoker,
            UserWeakPointRepository weakPointRepo,
            UserStrongPointRepository strongPointRepo,
            ProfileSemanticService semanticService,
            @Value("classpath:prompts/profile-update-system.st") Resource promptResource) throws Exception {
        this.chatClient = chatClientBuilder.build();
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.weakPointRepo = weakPointRepo;
        this.strongPointRepo = strongPointRepo;
        this.semanticService = semanticService;
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
        log.info("Using fallback semantic profile update for user: {}", userId);
        List<UserWeakPointEntity> existingWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);

        for (var weak : extraction.weakPoints()) {
            // 先尝试精确匹配
            UserWeakPointEntity exactMatch = null;
            for (UserWeakPointEntity e : existingWeak) {
                if (e.getQuestionText().equals(weak.question())) {
                    exactMatch = e;
                    break;
                }
            }

            if (exactMatch != null) {
                exactMatch.recordSeen();
                weakPointRepo.save(exactMatch);
            } else {
                // 精确匹配失败，尝试语义相似度匹配
                Optional<UserWeakPointEntity> semanticMatch =
                    semanticService.findSimilarWeakPoint(existingWeak, weak.question());

                if (semanticMatch.isPresent()) {
                    UserWeakPointEntity existing = semanticMatch.get();
                    existing.recordSeen();
                    if (weak.answerSummary() != null && existing.getAnswerSummary() == null) {
                        existing.setAnswerSummary(weak.answerSummary());
                    }
                    weakPointRepo.save(existing);
                    log.info("Semantic match updated: '{}' <-> '{}' (merged)", weak.question(), existing.getQuestionText());
                } else {
                    UserWeakPointEntity entity = UserWeakPointEntity.create(
                        userId, weak.topic(), weak.question(), weak.answerSummary(), weak.score(), sessionId);
                    weakPointRepo.save(entity);
                    existingWeak.add(entity);
                    semanticService.storeEmbedding(entity.getId(), weak.question());
                }
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
        double score = op.score() != null ? op.score() : 5.0;
        UserWeakPointEntity entity = UserWeakPointEntity.create(
            userId, op.topic(), op.point(), op.answerSummary(), score, sessionId);
        weakPointRepo.save(entity);
        log.info("ADD weak point: {} - {}", op.topic(), op.point());
    }

    private void applyWeakUpdate(List<UserWeakPointEntity> existing, ProfileUpdateResult.WeakPointOp op) {
        if (op.index() == null || op.index() < 0 || op.index() >= existing.size()) {
            log.warn("UPDATE index out of bounds: {}", op.index());
            return;
        }
        UserWeakPointEntity entity = existing.get(op.index());
        String oldText = entity.getQuestionText();
        entity.addHistoryEntry("UPDATE", oldText, op.newPoint(), null);
        entity.setQuestionText(op.newPoint());
        if (op.newAnswerSummary() != null) {
            entity.setAnswerSummary(op.newAnswerSummary());
        }
        entity.recordSeen();
        entity.setSrState(SpacedRepetitionService.buildInitialSrState(5.0));
        weakPointRepo.save(entity);
        log.info("UPDATE weak point [{}]: {} -> {}", op.index(), oldText, op.newPoint());
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
        entity.markImproved("IMPROVE", reason);
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
