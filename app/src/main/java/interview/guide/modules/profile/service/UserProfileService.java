package interview.guide.modules.profile.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.profile.entity.UserTopicMasteryEntity;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 用户画像核心服务
 * 管理弱项登记、间隔复习、画像查询、面试评估反馈循环等核心业务逻辑
 */
@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);

    // SM-2状态JSONB字段常量
    private static final String SR_INTERVAL_DAYS = "interval_days";
    private static final String SR_EASE_FACTOR = "ease_factor";
    private static final String SR_REPETITIONS = "repetitions";
    private static final String SR_NEXT_REVIEW = "next_review";
    private static final String SR_LAST_SCORE = "last_score";

    @Autowired private UserWeakPointRepository weakPointRepo;
    @Autowired private UserTopicMasteryRepository masteryRepo;
    @Autowired private UserProfileRepository profileRepo;
    @Autowired private SpacedRepetitionService srService;
    @Autowired private UserStrongPointRepository strongPointRepo;
    @Autowired private ProfileSemanticService semanticService;

    /**
     * 批量登记弱项到复习计划
     * 自动跳过已存在的重复题目（按题目文本精确匹配）
     */
    @Transactional
    public int enrollWeakPoints(String userId, List<WeakPointEnrollItem> items) {
        if (items == null || items.isEmpty()) return 0;

        Set<String> existing = new HashSet<>(weakPointRepo.findAllQuestionTextsByUserId(userId));

        List<UserWeakPointEntity> toSave = items.stream()
            .filter(item -> !existing.contains(item.questionText()))
            .map(item -> UserWeakPointEntity.create(
                userId, item.topic(), item.questionText(), item.answerSummary(),
                item.score(), item.sessionId()))
            .toList();
        weakPointRepo.saveAll(toSave);
        return toSave.size();
    }

    /** 查询指定主题下到期的待复习弱项 */
    public List<UserWeakPointEntity> getDueReviews(String userId, String topic) {
        return weakPointRepo.findDueReviews(userId, topic, LocalDate.now());
    }

    /** 查询所有到期的待复习弱项（不限主题） */
    public List<UserWeakPointEntity> getAllDueReviews(String userId) {
        return weakPointRepo.findAllDueReviews(userId, LocalDate.now());
    }

    /**
     * 提交复习评分，触发SM-2算法更新复习间隔
     * 连续通过3次以上自动标记为已改善，同时更新知识点掌握度
     */
    @Transactional
    public Sm2Result submitReviewAnswer(Long weakPointId, double score) {
        UserWeakPointEntity entity = weakPointRepo.findById(weakPointId)
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERVIEW_QUESTION_NOT_FOUND, "WeakPoint not found: " + weakPointId));

        Sm2State state = Sm2State.fromMap(entity.getSrState());
        Sm2Result result = srService.sm2Update(state, score);
        entity.setSrState(applySrResult(entity.getSrState(), result, score));

        if (srService.isImproved(result.repetitions())) {
            entity.markImproved("MANUAL_REVIEW", "手动复习中连续通过");
        }

        entity.recordSeen();
        weakPointRepo.save(entity);
        updateMasteryAfterReview(entity.getUserId(), entity.getTopic(), score);

        return result;
    }

    /** 复习后更新知识点掌握度（加权移动平均） */
    private void updateMasteryAfterReview(String userId, String topic, double score) {
        UserTopicMasteryEntity mastery = masteryRepo.findByUserIdAndTopic(userId, topic)
            .orElseGet(() -> {
                UserTopicMasteryEntity m = new UserTopicMasteryEntity();
                m.setUserId(userId);
                m.setTopic(topic);
                m.setScore(BigDecimal.valueOf(50.0));
                m.setSessionCount(0);
                return m;
            });

        int n = mastery.getSessionCount();
        double weight = Math.max(0.15, 1.0 / (n + 1));
        double newScore = mastery.getScore().doubleValue() * (1 - weight) + score * weight;
        mastery.setScore(BigDecimal.valueOf(Math.round(newScore * 10) / 10.0));
        mastery.setSessionCount(n + 1);
        mastery.setLastAssessed(LocalDateTime.now());
        masteryRepo.save(mastery);
    }

    /** 获取用户完整画像概览（知识点掌握度带时间衰减） */
    public UserProfileDto getProfile(String userId) {
        List<UserTopicMasteryEntity> masteries = masteryRepo.findByUserId(userId);

        List<TopicMasteryDto> topicMasteries = masteries.stream()
            .map(m -> new TopicMasteryDto(m.getTopic(),
                Math.round(SpacedRepetitionService.applyDecay(
                    m.getScore().doubleValue(), m.getLastAssessed()) * 10.0) / 10.0,
                m.getSessionCount()))
            .toList();

        long totalWeakPoints = weakPointRepo.findByUserIdAndIsImprovedFalse(userId).size();
        long improvedCount = weakPointRepo.countByUserIdAndIsImprovedTrue(userId);
        long dueReviewCount = weakPointRepo.countDueReviews(userId, LocalDate.now());

        return new UserProfileDto(userId, null, topicMasteries, (int) totalWeakPoints, (int) improvedCount, (int) dueReviewCount);
    }

    /** 获取用户强项列表 */
    public List<StrongPointDto> getStrongPoints(String userId) {
        return strongPointRepo.findByUserId(userId).stream()
            .map(e -> new StrongPointDto(
                e.getId(),
                e.getTopic(),
                e.getDescription(),
                e.getSource(),
                e.getSessionId(),
                e.getFirstSeen() != null ? e.getFirstSeen().toString() : null
            ))
            .toList();
    }

    /** 获取待复习弱项DTO列表 */
    public List<WeakPointDto> getDueReviewDtos(String userId, String topic) {
        List<UserWeakPointEntity> entities = topic != null
            ? getDueReviews(userId, topic)
            : getAllDueReviews(userId);
        return entities.stream().map(this::toDto).toList();
    }

    /** 归档长期未见的过时弱项（超过60天或30天且仅观察1-2次） */
    @Transactional
    public int archiveStaleWeakPoints(String userId) {
        List<UserWeakPointEntity> activeWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        int archived = 0;
        for (UserWeakPointEntity wp : activeWeak) {
            if (SpacedRepetitionService.shouldArchive(wp.getLastSeen(), wp.getTimesSeen())) {
                wp.markImproved("ARCHIVE_STALE", "长期未见，自动归档");
                weakPointRepo.save(wp);
                archived++;
            }
        }
        if (archived > 0) {
            log.info("Archived {} stale weak points for user: {}", archived, userId);
        }
        return archived;
    }

    /**
     * 面试评估后自动更新匹配弱项的 SR 状态（反馈循环）。
     * 预取全部弱项一次，避免 N+1 查询。
     */
    @Transactional
    public int autoUpdateSrFromEvaluation(String userId, List<EvaluationMatch> evaluations) {
        if (evaluations == null || evaluations.isEmpty()) return 0;

        // 预取全部活跃弱项（归档 + 匹配共用一次查询）
        List<UserWeakPointEntity> activeWeak = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);

        // 归档过时弱项（直接操作预取列表）
        int archived = 0;
        var iterator = activeWeak.iterator();
        while (iterator.hasNext()) {
            UserWeakPointEntity wp = iterator.next();
            if (SpacedRepetitionService.shouldArchive(wp.getLastSeen(), wp.getTimesSeen())) {
                wp.markImproved("ARCHIVE_STALE", "长期未见，自动归档");
                weakPointRepo.save(wp);
                iterator.remove();
                archived++;
            }
        }
        if (archived > 0) {
            log.info("Archived {} stale weak points for user: {}", archived, userId);
        }

        // 匹配评估结果并更新 SR（使用同一份预取列表）
        int updated = 0;
        for (EvaluationMatch eval : evaluations) {
            Optional<UserWeakPointEntity> match = semanticService.findMatchingWeakPoint(
                activeWeak, eval.question(), eval.topic());

            if (match.isPresent()) {
                UserWeakPointEntity wp = match.get();
                Sm2State state = Sm2State.fromMap(wp.getSrState());
                Sm2Result result = srService.sm2Update(state, eval.score());
                wp.setSrState(applySrResult(wp.getSrState(), result, eval.score()));
                wp.recordSeen();

                if (srService.isImproved(result.repetitions())) {
                    wp.markImproved("AUTO_IMPROVE", "面试评估中连续通过，自动标记为已改进");
                    activeWeak.remove(wp);
                }

                weakPointRepo.save(wp);
                updateMasteryAfterReview(userId, eval.topic(), eval.score());
                updated++;
                log.info("Auto SR update: weak point '{}' score={} -> nextReview={}",
                    wp.getQuestionText(), eval.score(), result.nextReview());
            }
        }
        return updated;
    }

    /** 获取带时间衰减的知识点掌握度评分 */
    public double getDecayedMasteryScore(String userId, String topic) {
        return masteryRepo.findByUserIdAndTopic(userId, topic)
            .map(m -> SpacedRepetitionService.applyDecay(m.getScore().doubleValue(), m.getLastAssessed()))
            .orElse(50.0);
    }

    /** 弱项实体转DTO */
    private WeakPointDto toDto(UserWeakPointEntity entity) {
        Map<String, Object> s = entity.getSrState();
        return new WeakPointDto(
            entity.getId(),
            entity.getTopic(),
            entity.getQuestionText(),
            entity.getAnswerSummary(),
            entity.getScore() != null ? entity.getScore().doubleValue() : null,
            entity.getSource(),
            entity.getSessionId(),
            s.get(SR_NEXT_REVIEW) != null ? LocalDate.parse((String) s.get(SR_NEXT_REVIEW)) : null,
            s.get(SR_EASE_FACTOR) instanceof Number n ? n.doubleValue() : 2.5,
            s.get(SR_REPETITIONS) instanceof Number n ? n.intValue() : 0,
            entity.getTimesSeen(),
            Boolean.TRUE.equals(entity.isImproved())
        );
    }

    /** 将SM-2计算结果写回JSONB状态Map */
    private static Map<String, Object> applySrResult(Map<String, Object> current, Sm2Result result, double lastScore) {
        Map<String, Object> newState = new HashMap<>(current);
        newState.put(SR_INTERVAL_DAYS, result.intervalDays());
        newState.put(SR_EASE_FACTOR, result.easeFactor());
        newState.put(SR_REPETITIONS, result.repetitions());
        newState.put(SR_NEXT_REVIEW, result.nextReview().toString());
        newState.put(SR_LAST_SCORE, lastScore);
        return newState;
    }
}
