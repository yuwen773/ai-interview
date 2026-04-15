package interview.guide.modules.profile.service;

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

    @Autowired private UserWeakPointRepository weakPointRepo;
    @Autowired private UserTopicMasteryRepository masteryRepo;
    @Autowired private UserProfileRepository profileRepo;
    @Autowired private SpacedRepetitionService srService;

    @Transactional
    public int enrollWeakPoints(String userId, List<WeakPointEnrollItem> items) {
        int count = 0;
        for (WeakPointEnrollItem item : items) {
            if (weakPointRepo.existsByUserIdAndQuestionText(userId, item.questionText())) {
                continue; // 防止重复录入
            }
            UserWeakPointEntity entity = new UserWeakPointEntity();
            entity.setUserId(userId);
            entity.setTopic(item.topic());
            entity.setQuestionText(item.questionText());
            entity.setAnswerSummary(item.answerSummary());
            entity.setScore(BigDecimal.valueOf(item.score()));
            entity.setSource(item.source());
            entity.setSessionId(item.sessionId());
            Map<String, Object> srState = new HashMap<>();
            srState.put("interval_days", 1);
            srState.put("ease_factor", 2.5);
            srState.put("repetitions", 0);
            srState.put("next_review", LocalDate.now().plusDays(1).toString());
            srState.put("last_score", item.score());
            entity.setSrState(srState);
            entity.setTimesSeen(1);
            weakPointRepo.save(entity);
            count++;
        }
        return count;
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
            .orElseThrow(() -> new RuntimeException("WeakPoint not found"));

        Map<String, Object> stateMap = entity.getSrState();
        Sm2State state = new Sm2State(
            toInt(stateMap, "interval_days", 1),
            toDouble(stateMap, "ease_factor", 2.5),
            toInt(stateMap, "repetitions", 0),
            LocalDate.parse((String) stateMap.get("next_review")),
            toDouble(stateMap, "last_score", 0.0)
        );

        Sm2Result result = srService.sm2Update(state, score);

        Map<String, Object> newState = new HashMap<>(stateMap);
        newState.put("interval_days", result.intervalDays());
        newState.put("ease_factor", result.easeFactor());
        newState.put("repetitions", result.repetitions());
        newState.put("next_review", result.nextReview().toString());
        newState.put("last_score", score);
        entity.setSrState(newState);

        if (srService.isImproved(result.repetitions())) {
            entity.setImproved(true);
            entity.setImprovedAt(LocalDateTime.now());
        }

        entity.setLastSeen(LocalDateTime.now());
        entity.setTimesSeen(entity.getTimesSeen() + 1);
        weakPointRepo.save(entity);

        // 同时更新 topic mastery
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

        List<UserWeakPointEntity> weakPoints = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        int dueReviewCount = weakPointRepo.findAllDueReviews(userId, LocalDate.now()).size();
        int improvedCount = (int) weakPointRepo.countByUserIdAndIsImprovedTrue(userId);

        return new UserProfileDto(userId, null, topicMasteries, weakPoints.size(), improvedCount, dueReviewCount);
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
            LocalDate.parse((String) s.get("next_review")),
            toDouble(s, "ease_factor", 2.5),
            toInt(s, "repetitions", 0),
            entity.getTimesSeen(),
            Boolean.TRUE.equals(entity.isImproved())
        );
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
