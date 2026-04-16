package interview.guide.modules.profile.service;

import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.model.dto.ProfileUpdateResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 画像更新编排服务
 * Mem0 式画像更新：两阶段流水线（提取 + 更新），从面试会话中提取弱项和强项并更新用户画像
 */
@Service
public class ProfileMemoryService {

    private static final Logger log = LoggerFactory.getLogger(ProfileMemoryService.class);

    private final InterviewSessionRepository sessionRepo;
    private final ProfileExtractService extractService;
    private final ProfileUpdateService updateService;

    public ProfileMemoryService(
            InterviewSessionRepository sessionRepo,
            ProfileExtractService extractService,
            ProfileUpdateService updateService) {
        this.sessionRepo = sessionRepo;
        this.extractService = extractService;
        this.updateService = updateService;
    }

    /**
     * 执行两阶段画像更新
     * Stage 1: 从面试会话中提取弱项和强项
     * Stage 2: 基于LLM决策更新画像，失败时回退到语义相似度匹配
     */
    public void extractAndUpdate(String sessionId, String userId) {
        log.info("Starting Mem0 profile update: sessionId={}, userId={}", sessionId, userId);

        Long numericSessionId = resolveNumericSessionId(sessionId);
        if (numericSessionId == null) {
            log.warn("Cannot resolve numeric session ID for: {}, skipping profile update", sessionId);
            return;
        }

        // Stage 1: Extract
        ProfileExtractResult extraction;
        try {
            extraction = extractService.extractFromSession(numericSessionId, userId);
            log.info("Stage 1 Extract complete: {} weak points, {} strong points",
                extraction.weakPoints().size(), extraction.strengths().size());
        } catch (Exception e) {
            log.error("Stage 1 Extract failed: {}", e.getMessage(), e);
            return;
        }

        if ((extraction.weakPoints() == null || extraction.weakPoints().isEmpty())
            && (extraction.strengths() == null || extraction.strengths().isEmpty())) {
            log.info("No insights extracted, skipping update");
            return;
        }

        // Stage 2: Update (with fallback)
        try {
            ProfileUpdateResult result = updateService.decideUpdates(userId, extraction);
            log.info("Stage 2 Update decided: {} weak ops, {} strong ops, {} improvements",
                result.weakPointOps().size(), result.strongPointOps().size(), result.improvements().size());
            updateService.applyOperations(userId, result, numericSessionId);
        } catch (Exception e) {
            log.warn("Stage 2 LLM decision failed, using fallback: {}", e.getMessage());
            updateService.applyFallback(userId, extraction, numericSessionId);
        }

        log.info("Mem0 profile update complete: sessionId={}", sessionId);
    }

    /** 将UUID格式的sessionId解析为数据库自增ID */
    private Long resolveNumericSessionId(String sessionId) {
        return sessionRepo.findBySessionId(sessionId)
            .map(InterviewSessionEntity::getId)
            .orElse(null);
    }
}
