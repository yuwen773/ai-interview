package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.repository.UserBehaviorSignalRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BehaviorSignalServiceTest {

    @Test
    void shouldCanonicalizeSignalKey() {
        assertEquals("communication_missing_example",
            BehaviorSignalService.canonicalizeSignalKey("Communication Missing Example!"));
    }

    @Test
    void shouldMergeExistingSignalAndKeepLatestFiveEvidenceItems() {
        UserBehaviorSignalRepository repository = mock(UserBehaviorSignalRepository.class);
        BehaviorSignalService service = new BehaviorSignalService(repository);
        UserBehaviorSignalEntity existing = existingSignal("communication", "communication_missing_example");
        existing.setTimesSeen(1);
        existing.setEvidenceJson(new ArrayList<>(List.of(Map.of("topic", "Old", "summary", "old evidence"))));
        when(repository.findByUserIdAndNamespaceAndSignalKey("default", "communication", "communication_missing_example"))
            .thenReturn(Optional.of(existing));

        int updated = service.applyInsights("default", List.of(insight(
            "communication",
            "communication_missing_example",
            "NEGATIVE",
            0.9,
            evidence("Redis", "缺少例子"),
            evidence("JVM", "缺少例子"),
            evidence("MySQL", "缺少例子"),
            evidence("Spring", "缺少例子"),
            evidence("Kafka", "缺少例子"),
            evidence("Network", "缺少例子")
        )), 7L);

        assertEquals(1, updated);
        assertEquals(2, existing.getTimesSeen());
        assertEquals(5, existing.getEvidenceJson().size());
        assertEquals("Network", existing.getEvidenceJson().get(4).get("topic"));
        verify(repository).save(existing);
    }

    @Test
    void shouldDropLowConfidenceOrEmptyEvidenceSignal() {
        UserBehaviorSignalRepository repository = mock(UserBehaviorSignalRepository.class);
        BehaviorSignalService service = new BehaviorSignalService(repository);
        ProfileExtractResult.BehaviorSignalInsight lowConfidence = insight(
            "communication",
            "communication_missing_example",
            "NEGATIVE",
            0.49,
            evidence("Redis", "缺少例子")
        );
        ProfileExtractResult.BehaviorSignalInsight noEvidence = insight(
            "reasoning",
            "reasoning_boundary_case_gap",
            "NEGATIVE",
            0.9
        );

        int updated = service.applyInsights("default", List.of(lowConfidence, noEvidence), 1L);

        assertEquals(0, updated);
        verify(repository, never()).save(any());
    }

    @Test
    void shouldMarkNegativeSignalImprovingWhenPositiveEvidenceAppears() {
        UserBehaviorSignalRepository repository = mock(UserBehaviorSignalRepository.class);
        BehaviorSignalService service = new BehaviorSignalService(repository);
        UserBehaviorSignalEntity existing = existingSignal("communication", "communication_missing_example");
        existing.setPolarity("NEGATIVE");
        existing.setStatus("ACTIVE");
        when(repository.findByUserIdAndNamespaceAndSignalKey("default", "communication", "communication_missing_example"))
            .thenReturn(Optional.of(existing));

        service.applyInsights("default", List.of(insight(
            "communication",
            "communication_missing_example",
            "POSITIVE",
            0.9,
            evidence("Redis", "补充了具体例子")
        )), 3L);

        assertEquals("IMPROVING", existing.getStatus());
        assertNotNull(existing.getImprovedAt());
        verify(repository).save(existing);
    }

    @Test
    void shouldCreateNewSignalWithCleanedEvidence() {
        UserBehaviorSignalRepository repository = mock(UserBehaviorSignalRepository.class);
        BehaviorSignalService service = new BehaviorSignalService(repository);
        when(repository.findByUserIdAndNamespaceAndSignalKey("default", "reasoning", "reasoning_stepwise_analysis"))
            .thenReturn(Optional.empty());
        ArgumentCaptor<UserBehaviorSignalEntity> captor = ArgumentCaptor.forClass(UserBehaviorSignalEntity.class);

        int updated = service.applyInsights("default", List.of(insight(
            "reasoning",
            "Reasoning Stepwise Analysis",
            "POSITIVE",
            0.9,
            evidence("Redis", "先拆问题再给方案"),
            evidence(" ", "无效主题"),
            evidence("JVM", " ")
        )), 8L);

        assertEquals(1, updated);
        verify(repository).save(captor.capture());
        UserBehaviorSignalEntity saved = captor.getValue();
        assertEquals("default", saved.getUserId());
        assertEquals("reasoning_stepwise_analysis", saved.getSignalKey());
        assertEquals(1, saved.getEvidenceJson().size());
        assertEquals(8L, saved.getEvidenceJson().get(0).get("sessionId"));
    }

    private static UserBehaviorSignalEntity existingSignal(String namespace, String signalKey) {
        UserBehaviorSignalEntity entity = new UserBehaviorSignalEntity();
        entity.setUserId("default");
        entity.setNamespace(namespace);
        entity.setSignalKey(signalKey);
        entity.setPolarity("NEGATIVE");
        entity.setStatement("回答有结论但缺少例子");
        entity.setStatus("ACTIVE");
        entity.setTimesSeen(1);
        entity.setEvidenceJson(new ArrayList<>());
        return entity;
    }

    private static ProfileExtractResult.BehaviorSignalInsight insight(
            String namespace,
            String signalKey,
            String polarity,
            double confidence,
            ProfileExtractResult.BehaviorSignalEvidence... evidence) {
        return new ProfileExtractResult.BehaviorSignalInsight(
            namespace,
            signalKey,
            polarity,
            "回答有结论但缺少例子",
            List.of(evidence),
            confidence
        );
    }

    private static ProfileExtractResult.BehaviorSignalEvidence evidence(String topic, String summary) {
        return new ProfileExtractResult.BehaviorSignalEvidence(topic, null, summary);
    }
}
