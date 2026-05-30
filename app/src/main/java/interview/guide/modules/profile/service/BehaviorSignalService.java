package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import interview.guide.modules.profile.model.BehaviorSignalPolarity;
import interview.guide.modules.profile.model.BehaviorSignalStatus;
import interview.guide.modules.profile.model.dto.BehaviorSignalDto;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.repository.UserBehaviorSignalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BehaviorSignalService {

    private static final double MIN_CONFIDENCE = 0.60;
    private static final int MAX_EVIDENCE_ITEMS = 5;

    private final UserBehaviorSignalRepository repository;

    public List<BehaviorSignalDto> getSignals(String userId, String namespace, String status) {
        String normalizedNamespace = blankToNull(namespace);
        String normalizedStatus = blankToNull(status);
        List<UserBehaviorSignalEntity> signals;
        if (normalizedNamespace != null && normalizedStatus != null) {
            signals = repository.findByUserIdAndNamespaceAndStatus(userId, normalizedNamespace, normalizedStatus);
        } else if (normalizedStatus != null) {
            signals = repository.findByUserIdAndStatus(userId, normalizedStatus);
        } else {
            signals = repository.findByUserId(userId);
            if (normalizedNamespace != null) {
                signals = signals.stream()
                    .filter(signal -> normalizedNamespace.equals(signal.getNamespace()))
                    .toList();
            }
        }
        return signals.stream().map(this::toDto).toList();
    }

    @Transactional
    public int applyInsights(String userId, List<ProfileExtractResult.BehaviorSignalInsight> insights, Long sessionId) {
        if (insights == null || insights.isEmpty()) {
            return 0;
        }

        int updated = 0;
        for (ProfileExtractResult.BehaviorSignalInsight insight : insights) {
            if (insight == null || insight.confidence() < MIN_CONFIDENCE) {
                continue;
            }
            String namespace = normalizeNamespace(insight.namespace());
            String signalKey = canonicalizeSignalKey(insight.signalKey());
            if (namespace == null || signalKey.isBlank()) {
                continue;
            }

            List<Map<String, Object>> evidence = cleanEvidence(insight.evidence(), sessionId);
            if (evidence.isEmpty()) {
                continue;
            }

            UserBehaviorSignalEntity entity = repository
                .findByUserIdAndNamespaceAndSignalKey(userId, namespace, signalKey)
                .orElseGet(() -> newSignal(userId, namespace, signalKey, insight));
            mergeSignal(entity, insight, evidence, sessionId);
            repository.save(entity);
            updated++;
        }
        return updated;
    }

    public static String canonicalizeSignalKey(String raw) {
        String normalized = raw == null ? "" : raw.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "_")
            .replaceAll("_+", "_")
            .replaceAll("^_|_$", "");
        return normalized.length() > 128 ? normalized.substring(0, 128) : normalized;
    }

    private void mergeSignal(
            UserBehaviorSignalEntity entity,
            ProfileExtractResult.BehaviorSignalInsight insight,
            List<Map<String, Object>> evidence,
            Long sessionId) {
        String incomingPolarity = normalizePolarity(insight.polarity());
        if (BehaviorSignalPolarity.POSITIVE.name().equals(incomingPolarity)
                && BehaviorSignalPolarity.NEGATIVE.name().equals(entity.getPolarity())
                && BehaviorSignalStatus.ACTIVE.name().equals(entity.getStatus())) {
            entity.setStatus(BehaviorSignalStatus.IMPROVING.name());
            entity.setImprovedAt(LocalDateTime.now());
        } else if (entity.getPolarity() == null || entity.getPolarity().isBlank()) {
            entity.setPolarity(incomingPolarity);
        }

        if (insight.statement() != null && !insight.statement().isBlank()) {
            entity.setStatement(insight.statement().trim());
        }
        entity.setSourceType("INTERVIEW");
        entity.setSourceSessionId(sessionId);
        entity.setTimesSeen(entity.getTimesSeen() != null ? entity.getTimesSeen() + 1 : 1);

        List<Map<String, Object>> merged = new ArrayList<>();
        if (entity.getEvidenceJson() != null) {
            merged.addAll(entity.getEvidenceJson());
        }
        merged.addAll(evidence);
        int fromIndex = Math.max(0, merged.size() - MAX_EVIDENCE_ITEMS);
        entity.setEvidenceJson(new ArrayList<>(merged.subList(fromIndex, merged.size())));
    }

    private UserBehaviorSignalEntity newSignal(
            String userId,
            String namespace,
            String signalKey,
            ProfileExtractResult.BehaviorSignalInsight insight) {
        UserBehaviorSignalEntity entity = new UserBehaviorSignalEntity();
        entity.setUserId(userId);
        entity.setNamespace(namespace);
        entity.setSignalKey(signalKey);
        entity.setPolarity(normalizePolarity(insight.polarity()));
        entity.setStatement(insight.statement() != null && !insight.statement().isBlank()
            ? insight.statement().trim()
            : signalKey);
        entity.setStatus(BehaviorSignalStatus.ACTIVE.name());
        entity.setTimesSeen(0);
        return entity;
    }

    private List<Map<String, Object>> cleanEvidence(
            List<ProfileExtractResult.BehaviorSignalEvidence> evidence,
            Long sessionId) {
        if (evidence == null || evidence.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (ProfileExtractResult.BehaviorSignalEvidence item : evidence) {
            if (item == null || item.topic() == null || item.topic().isBlank()
                    || item.summary() == null || item.summary().isBlank()) {
                continue;
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("topic", item.topic().trim());
            map.put("sessionId", item.sessionId() != null ? item.sessionId() : sessionId);
            map.put("summary", item.summary().trim());
            map.put("seenAt", LocalDateTime.now().toString());
            result.add(map);
        }
        return result;
    }

    private BehaviorSignalDto toDto(UserBehaviorSignalEntity entity) {
        return new BehaviorSignalDto(
            entity.getId(),
            entity.getNamespace(),
            entity.getSignalKey(),
            entity.getPolarity(),
            entity.getStatement(),
            entity.getEvidenceJson(),
            entity.getTimesSeen(),
            entity.getStatus(),
            entity.getLastSeen() != null ? entity.getLastSeen().toString() : null
        );
    }

    private static String normalizeNamespace(String namespace) {
        String normalized = blankToNull(namespace);
        return normalized != null ? normalized.toLowerCase(Locale.ROOT) : null;
    }

    private static String normalizePolarity(String polarity) {
        String normalized = blankToNull(polarity);
        if (normalized == null) {
            return BehaviorSignalPolarity.NEUTRAL.name();
        }
        try {
            return BehaviorSignalPolarity.valueOf(normalized.toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException e) {
            return BehaviorSignalPolarity.NEUTRAL.name();
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
