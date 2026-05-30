package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import interview.guide.modules.profile.entity.UserProfileEntity;
import interview.guide.modules.profile.entity.UserProfilePatternEntity;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.model.dto.ProfilePatternDto;
import interview.guide.modules.profile.repository.UserBehaviorSignalRepository;
import interview.guide.modules.profile.repository.UserProfilePatternRepository;
import interview.guide.modules.profile.repository.UserProfileRepository;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileConsolidationService {

    private static final String ACTIVE = "ACTIVE";
    private static final String BEHAVIOR_RISK = "BEHAVIOR_RISK";
    private static final String KNOWLEDGE_GAP = "KNOWLEDGE_GAP";

    private final UserProfileRepository profileRepository;
    private final UserBehaviorSignalRepository behaviorSignalRepository;
    private final UserWeakPointRepository weakPointRepository;
    private final UserProfilePatternRepository patternRepository;

    public boolean shouldConsolidate(String userId) {
        Optional<UserProfileEntity> profile = profileRepository.findByUserId(userId);
        boolean staleByTime = profile
            .map(UserProfileEntity::getLastConsolidatedAt)
            .map(last -> last.isBefore(LocalDateTime.now().minusHours(24)))
            .orElse(true);
        boolean enoughSignals = behaviorSignalRepository.countByUserIdAndStatus(userId, ACTIVE) >= 5;
        List<UserWeakPointEntity> activeWeakPoints = weakPointRepository.findByUserIdAndIsImprovedFalse(userId);
        boolean enoughWeakPoints = activeWeakPoints.size() >= 10;
        boolean crossTopicPattern = hasCrossTopicBehaviorPattern(userId)
            || hasCrossTopicWeakPointPattern(activeWeakPoints);
        return staleByTime || enoughSignals || enoughWeakPoints || crossTopicPattern;
    }

    @Transactional
    public int consolidateIfNeeded(String userId) {
        if (!shouldConsolidate(userId)) {
            return 0;
        }

        int patterns = 0;
        List<UserBehaviorSignalEntity> activeSignals = behaviorSignalRepository.findByUserIdAndStatus(userId, ACTIVE);
        patterns += consolidateBehaviorPatterns(userId, activeSignals);

        List<UserWeakPointEntity> activeWeakPoints = weakPointRepository.findByUserIdAndIsImprovedFalse(userId);
        patterns += consolidateWeakPointPatterns(userId, activeWeakPoints);

        UserProfileEntity profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserProfileEntity created = new UserProfileEntity();
                created.setUserId(userId);
                return created;
            });
        profile.setLastConsolidatedAt(LocalDateTime.now());
        profileRepository.save(profile);
        return patterns;
    }

    public List<ProfilePatternDto> getPatterns(String userId, String status) {
        String resolvedStatus = status == null || status.isBlank() ? ACTIVE : status;
        return patternRepository.findByUserIdAndStatusOrderByLastSeenDesc(userId, resolvedStatus)
            .stream()
            .map(this::toDto)
            .toList();
    }

    static String normalizeWeakPointKey(String text) {
        if (text == null) return "";
        String value = text.toLowerCase(Locale.ROOT)
            .replaceAll("[\\p{Punct}\\p{P}\\s]+", "");
        return value.length() > 80 ? value.substring(0, 80) : value;
    }

    private int consolidateBehaviorPatterns(String userId, List<UserBehaviorSignalEntity> activeSignals) {
        int saved = 0;
        Map<String, List<UserBehaviorSignalEntity>> bySignal = activeSignals.stream()
            .collect(Collectors.groupingBy(
                signal -> signal.getNamespace() + ":" + signal.getSignalKey(),
                LinkedHashMap::new,
                Collectors.toList()
            ));

        for (var entry : bySignal.entrySet()) {
            LinkedHashSet<String> topics = new LinkedHashSet<>();
            List<Long> signalIds = new ArrayList<>();
            List<Map<String, Object>> evidence = new ArrayList<>();
            for (UserBehaviorSignalEntity signal : entry.getValue()) {
                if (signal.getId() != null) {
                    signalIds.add(signal.getId());
                }
                for (Map<String, Object> item : safeEvidence(signal.getEvidenceJson())) {
                    Object topic = item.get("topic");
                    if (topic instanceof String text && !text.isBlank()) {
                        topics.add(text);
                        evidence.add(new LinkedHashMap<>(item));
                    }
                }
            }
            if (topics.size() < 2) {
                continue;
            }

            UserBehaviorSignalEntity first = entry.getValue().get(0);
            String title = behaviorPatternTitle(first.getNamespace(), first.getSignalKey());
            UserProfilePatternEntity pattern = findActivePattern(userId, BEHAVIOR_RISK, title)
                .orElseGet(() -> newPattern(userId, BEHAVIOR_RISK, title));
            pattern.setSummary("该表现信号在多个主题中重复出现，需要专项训练。");
            pattern.setRelatedTopics(new ArrayList<>(topics));
            pattern.setRelatedSignalIds(signalIds);
            pattern.setEvidenceJson(evidence);
            pattern.setConfidence(new BigDecimal("0.750"));
            patternRepository.save(pattern);
            saved++;
        }
        return saved;
    }

    private int consolidateWeakPointPatterns(String userId, List<UserWeakPointEntity> activeWeakPoints) {
        int saved = 0;
        Map<String, List<UserWeakPointEntity>> byKey = activeWeakPoints.stream()
            .filter(wp -> wp.getTopic() != null && !wp.getTopic().isBlank())
            .collect(Collectors.groupingBy(
                wp -> normalizeWeakPointKey(wp.getQuestionText()),
                LinkedHashMap::new,
                Collectors.toList()
            ));

        for (var entry : byKey.entrySet()) {
            String key = entry.getKey();
            if (key.isBlank()) {
                continue;
            }
            LinkedHashSet<String> topics = entry.getValue().stream()
                .map(UserWeakPointEntity::getTopic)
                .filter(topic -> topic != null && !topic.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
            if (topics.size() < 2) {
                continue;
            }

            String title = "知识缺口：" + key;
            UserProfilePatternEntity pattern = findActivePattern(userId, KNOWLEDGE_GAP, title)
                .orElseGet(() -> newPattern(userId, KNOWLEDGE_GAP, title));
            pattern.setSummary("该问题在多个主题中重复出现，需要专项复习。");
            pattern.setRelatedTopics(new ArrayList<>(topics));
            pattern.setRelatedSignalIds(List.of());
            pattern.setEvidenceJson(entry.getValue().stream()
                .map(this::weakPointEvidence)
                .toList());
            pattern.setConfidence(new BigDecimal("0.750"));
            patternRepository.save(pattern);
            saved++;
        }
        return saved;
    }

    private boolean hasCrossTopicBehaviorPattern(String userId) {
        return behaviorSignalRepository.findByUserIdAndStatus(userId, ACTIVE).stream()
            .anyMatch(signal -> evidenceTopics(signal).size() >= 2);
    }

    private boolean hasCrossTopicWeakPointPattern(List<UserWeakPointEntity> activeWeakPoints) {
        return activeWeakPoints.stream()
            .filter(wp -> wp.getTopic() != null && !wp.getTopic().isBlank())
            .collect(Collectors.groupingBy(
                wp -> normalizeWeakPointKey(wp.getQuestionText()),
                Collectors.mapping(UserWeakPointEntity::getTopic, Collectors.toSet())
            ))
            .entrySet().stream()
            .anyMatch(entry -> !entry.getKey().isBlank() && entry.getValue().size() >= 2);
    }

    private Set<String> evidenceTopics(UserBehaviorSignalEntity signal) {
        return safeEvidence(signal.getEvidenceJson()).stream()
            .map(item -> item.get("topic"))
            .filter(String.class::isInstance)
            .map(String.class::cast)
            .filter(topic -> !topic.isBlank())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Optional<UserProfilePatternEntity> findActivePattern(String userId, String patternType, String title) {
        Optional<UserProfilePatternEntity> result = patternRepository
            .findByUserIdAndPatternTypeAndTitleAndStatus(userId, patternType, title, ACTIVE);
        return result != null ? result : Optional.empty();
    }

    private UserProfilePatternEntity newPattern(String userId, String patternType, String title) {
        UserProfilePatternEntity pattern = new UserProfilePatternEntity();
        pattern.setUserId(userId);
        pattern.setPatternType(patternType);
        pattern.setTitle(title);
        pattern.setStatus(ACTIVE);
        return pattern;
    }

    private Map<String, Object> weakPointEvidence(UserWeakPointEntity weakPoint) {
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("topic", weakPoint.getTopic());
        evidence.put("questionText", weakPoint.getQuestionText());
        evidence.put("weakPointId", weakPoint.getId());
        evidence.put("lastSeen", weakPoint.getLastSeen() != null ? weakPoint.getLastSeen().toString() : null);
        return evidence;
    }

    private ProfilePatternDto toDto(UserProfilePatternEntity entity) {
        return new ProfilePatternDto(
            entity.getId(),
            entity.getPatternType(),
            entity.getTitle(),
            entity.getSummary(),
            entity.getRelatedTopics(),
            entity.getRelatedSignalIds(),
            entity.getConfidence() != null ? entity.getConfidence().doubleValue() : null,
            entity.getStatus(),
            entity.getLastSeen() != null ? entity.getLastSeen().toString() : null
        );
    }

    private static String behaviorPatternTitle(String namespace, String signalKey) {
        String prefix = switch (namespace != null ? namespace : "") {
            case "communication" -> "沟通表达模式：";
            case "reasoning" -> "推理分析模式：";
            case "narrative" -> "项目叙事模式：";
            case "metacognition" -> "自我校准模式：";
            default -> "表现模式：";
        };
        return prefix + signalKey;
    }

    private static List<Map<String, Object>> safeEvidence(List<Map<String, Object>> evidence) {
        return evidence != null ? evidence : List.of();
    }
}
