package interview.guide.modules.profile.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.profile.entity.*;
import interview.guide.modules.profile.model.*;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserProfileService {

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

    @Transactional
    public int enrollWeakPoints(String userId, List<WeakPointEnrollItem> items) {
        if (items == null || items.isEmpty()) return 0;

        Set<String> existing = new HashSet<>(weakPointRepo.findAllQuestionTextsByUserId(userId));

        List<UserWeakPointEntity> toSave = items.stream()
            .filter(item -> !existing.contains(item.questionText()))
            .map(item -> {
                UserWeakPointEntity entity = new UserWeakPointEntity();
                entity.setUserId(userId);
                entity.setTopic(item.topic());
                entity.setQuestionText(item.questionText());
                entity.setAnswerSummary(item.answerSummary());
                entity.setScore(BigDecimal.valueOf(item.score()));
                entity.setSource(item.source());
                entity.setSessionId(item.sessionId());
                entity.setSrState(SpacedRepetitionService.buildInitialSrState(item.score()));
                entity.setTimesSeen(1);
                return entity;
            })
            .toList();
        weakPointRepo.saveAll(toSave);
        return toSave.size();
    }

    public List<UserWeakPointEntity> getDueReviews(String userId, String topic) {
        return weakPointRepo.findDueReviews(userId, topic, LocalDate.now());
    }

    public List<UserWeakPointEntity> getAllDueReviews(String userId) {
        return weakPointRepo.findAllDueReviews(userId, LocalDate.now());
    }

    @Transactional
    public Sm2Result submitReviewAnswer(Long weakPointId, double score) {
        UserWeakPointEntity entity = weakPointRepo.findById(weakPointId)
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERVIEW_QUESTION_NOT_FOUND, "WeakPoint not found: " + weakPointId));

        Map<String, Object> stateMap = entity.getSrState();
        Sm2State state = new Sm2State(
            toInt(stateMap, SR_INTERVAL_DAYS, 1),
            toDouble(stateMap, SR_EASE_FACTOR, 2.5),
            toInt(stateMap, SR_REPETITIONS, 0),
            LocalDate.parse((String) stateMap.get(SR_NEXT_REVIEW)),
            toDouble(stateMap, SR_LAST_SCORE, 0.0)
        );

        Sm2Result result = srService.sm2Update(state, score);

        entity.setSrState(applySrResult(stateMap, result, score));

        if (srService.isImproved(result.repetitions())) {
            entity.setImproved(true);
            entity.setImprovedAt(LocalDateTime.now());
        }

        entity.setLastSeen(LocalDateTime.now());
        entity.setTimesSeen(entity.getTimesSeen() + 1);
        weakPointRepo.save(entity);

        updateMasteryAfterReview(entity.getUserId(), entity.getTopic(), score);

        return result;
    }

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

    public UserProfileDto getProfile(String userId) {
        List<UserTopicMasteryEntity> masteries = masteryRepo.findByUserId(userId);

        List<TopicMasteryDto> topicMasteries = masteries.stream()
            .map(m -> new TopicMasteryDto(m.getTopic(), m.getScore().doubleValue(), m.getSessionCount()))
            .toList();

        long totalWeakPoints = weakPointRepo.findByUserIdAndIsImprovedFalse(userId).size();
        long improvedCount = weakPointRepo.countByUserIdAndIsImprovedTrue(userId);
        long dueReviewCount = weakPointRepo.countDueReviews(userId, LocalDate.now());

        return new UserProfileDto(userId, null, topicMasteries, (int) totalWeakPoints, (int) improvedCount, (int) dueReviewCount);
    }

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

    public List<WeakPointDto> getDueReviewDtos(String userId, String topic) {
        List<UserWeakPointEntity> entities = topic != null
            ? getDueReviews(userId, topic)
            : getAllDueReviews(userId);
        return entities.stream().map(this::toDto).toList();
    }

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
            LocalDate.parse((String) s.get(SR_NEXT_REVIEW)),
            toDouble(s, SR_EASE_FACTOR, 2.5),
            toInt(s, SR_REPETITIONS, 0),
            entity.getTimesSeen(),
            Boolean.TRUE.equals(entity.isImproved())
        );
    }

    private static Map<String, Object> applySrResult(Map<String, Object> current, Sm2Result result, double lastScore) {
        Map<String, Object> newState = new HashMap<>(current);
        newState.put(SR_INTERVAL_DAYS, result.intervalDays());
        newState.put(SR_EASE_FACTOR, result.easeFactor());
        newState.put(SR_REPETITIONS, result.repetitions());
        newState.put(SR_NEXT_REVIEW, result.nextReview().toString());
        newState.put(SR_LAST_SCORE, lastScore);
        return newState;
    }

    private static int toInt(Map<String, Object> map, String key, int defaultValue) {
        Object v = map.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        return defaultValue;
    }

    private static double toDouble(Map<String, Object> map, String key, double defaultValue) {
        Object v = map.get(key);
        if (v instanceof Number) return ((Number) v).doubleValue();
        return defaultValue;
    }
}
