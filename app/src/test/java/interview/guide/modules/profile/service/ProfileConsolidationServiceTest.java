package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import interview.guide.modules.profile.entity.UserProfileEntity;
import interview.guide.modules.profile.entity.UserProfilePatternEntity;
import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.repository.UserBehaviorSignalRepository;
import interview.guide.modules.profile.repository.UserProfilePatternRepository;
import interview.guide.modules.profile.repository.UserProfileRepository;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileConsolidationServiceTest {

    @Test
    void shouldTriggerWhenActiveSignalsReachFive() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(recentProfile()));
        when(fixture.behaviorSignalRepository.countByUserIdAndStatus("default", "ACTIVE")).thenReturn(5L);
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());

        assertTrue(fixture.service.shouldConsolidate("default"));
    }

    @Test
    void shouldTriggerWhenActiveWeakPointsReachTen() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(recentProfile()));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default"))
            .thenReturn(List.of(
                weakPoint(1L, "Redis", "same question"),
                weakPoint(2L, "JVM", "same question"),
                weakPoint(3L, "MySQL", "same question"),
                weakPoint(4L, "Kafka", "same question"),
                weakPoint(5L, "Spring", "same question"),
                weakPoint(6L, "Netty", "same question"),
                weakPoint(7L, "OS", "same question"),
                weakPoint(8L, "Network", "same question"),
                weakPoint(9L, "Docker", "same question"),
                weakPoint(10L, "K8s", "same question")
            ));

        assertTrue(fixture.service.shouldConsolidate("default"));
    }

    @Test
    void shouldTriggerWhenLastConsolidatedAtIsOlderThanTwentyFourHours() {
        var fixture = fixture();
        UserProfileEntity profile = recentProfile();
        profile.setLastConsolidatedAt(LocalDateTime.now().minusHours(25));
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(profile));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());

        assertTrue(fixture.service.shouldConsolidate("default"));
    }

    @Test
    void shouldNotTriggerWhenNoConditionMatches() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(recentProfile()));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());

        assertFalse(fixture.service.shouldConsolidate("default"));
    }

    @Test
    void shouldCreateBehaviorRiskPatternForSameSignalAcrossTwoTopics() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(staleProfile()));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE"))
            .thenReturn(List.of(signal(1L, "communication", "communication_missing_example", "Redis", "JVM")));
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());
        ArgumentCaptor<UserProfilePatternEntity> captor = ArgumentCaptor.forClass(UserProfilePatternEntity.class);

        int created = fixture.service.consolidateIfNeeded("default");

        assertEquals(1, created);
        verify(fixture.patternRepository).save(captor.capture());
        UserProfilePatternEntity pattern = captor.getValue();
        assertEquals("BEHAVIOR_RISK", pattern.getPatternType());
        assertEquals("沟通表达模式：communication_missing_example", pattern.getTitle());
        assertEquals(List.of("Redis", "JVM"), pattern.getRelatedTopics());
        assertEquals(List.of(1L), pattern.getRelatedSignalIds());
    }

    @Test
    void shouldCreateKnowledgeGapPatternForSameWeakPointKeyAcrossTwoTopics() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(staleProfile()));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default"))
            .thenReturn(List.of(
                weakPoint(1L, "Redis", "缓存一致性怎么保证？"),
                weakPoint(2L, "MySQL", "缓存一致性怎么保证？")
            ));
        ArgumentCaptor<UserProfilePatternEntity> captor = ArgumentCaptor.forClass(UserProfilePatternEntity.class);

        int created = fixture.service.consolidateIfNeeded("default");

        assertEquals(1, created);
        verify(fixture.patternRepository).save(captor.capture());
        UserProfilePatternEntity pattern = captor.getValue();
        assertEquals("KNOWLEDGE_GAP", pattern.getPatternType());
        assertEquals("知识缺口：缓存一致性怎么保证", pattern.getTitle());
        assertEquals(List.of("Redis", "MySQL"), pattern.getRelatedTopics());
    }

    @Test
    void shouldSkipEvidenceWithoutTopic() {
        var fixture = fixture();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(staleProfile()));
        UserBehaviorSignalEntity signal = signal(1L, "communication", "communication_missing_example");
        signal.setEvidenceJson(new ArrayList<>(List.of(Map.of("summary", "缺少例子"))));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of(signal));
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());

        int created = fixture.service.consolidateIfNeeded("default");

        assertEquals(0, created);
        verify(fixture.patternRepository, never()).save(any());
    }

    @Test
    void shouldUpdateLastConsolidatedAtAfterSuccessfulRun() {
        var fixture = fixture();
        UserProfileEntity profile = staleProfile();
        when(fixture.profileRepository.findByUserId("default")).thenReturn(Optional.of(profile));
        when(fixture.behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE")).thenReturn(List.of());
        when(fixture.weakPointRepository.findByUserIdAndIsImprovedFalse("default")).thenReturn(List.of());

        int created = fixture.service.consolidateIfNeeded("default");

        assertEquals(0, created);
        assertNotNull(profile.getLastConsolidatedAt());
        verify(fixture.profileRepository).save(profile);
    }

    private static Fixture fixture() {
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        UserBehaviorSignalRepository behaviorSignalRepository = mock(UserBehaviorSignalRepository.class);
        UserWeakPointRepository weakPointRepository = mock(UserWeakPointRepository.class);
        UserProfilePatternRepository patternRepository = mock(UserProfilePatternRepository.class);
        return new Fixture(
            profileRepository,
            behaviorSignalRepository,
            weakPointRepository,
            patternRepository,
            new ProfileConsolidationService(
                profileRepository,
                behaviorSignalRepository,
                weakPointRepository,
                patternRepository
            )
        );
    }

    private static UserProfileEntity recentProfile() {
        UserProfileEntity profile = new UserProfileEntity();
        profile.setUserId("default");
        profile.setLastConsolidatedAt(LocalDateTime.now());
        return profile;
    }

    private static UserProfileEntity staleProfile() {
        UserProfileEntity profile = new UserProfileEntity();
        profile.setUserId("default");
        profile.setLastConsolidatedAt(LocalDateTime.now().minusHours(25));
        return profile;
    }

    private static UserBehaviorSignalEntity signal(Long id, String namespace, String key, String... topics) {
        UserBehaviorSignalEntity signal = signal(id, namespace, key);
        List<Map<String, Object>> evidence = new ArrayList<>();
        for (String topic : topics) {
            evidence.add(Map.of("topic", topic, "summary", "缺少例子"));
        }
        signal.setEvidenceJson(evidence);
        return signal;
    }

    private static UserBehaviorSignalEntity signal(Long id, String namespace, String key) {
        UserBehaviorSignalEntity signal = new UserBehaviorSignalEntity();
        signal.setId(id);
        signal.setUserId("default");
        signal.setNamespace(namespace);
        signal.setSignalKey(key);
        signal.setPolarity("NEGATIVE");
        signal.setStatement("回答有结论但缺少例子");
        signal.setStatus("ACTIVE");
        signal.setTimesSeen(2);
        return signal;
    }

    private static UserWeakPointEntity weakPoint(Long id, String topic, String question) {
        UserWeakPointEntity weakPoint = new UserWeakPointEntity();
        weakPoint.setId(id);
        weakPoint.setUserId("default");
        weakPoint.setTopic(topic);
        weakPoint.setQuestionText(question);
        weakPoint.setImproved(false);
        weakPoint.setLastSeen(LocalDateTime.now());
        return weakPoint;
    }

    private record Fixture(
        UserProfileRepository profileRepository,
        UserBehaviorSignalRepository behaviorSignalRepository,
        UserWeakPointRepository weakPointRepository,
        UserProfilePatternRepository patternRepository,
        ProfileConsolidationService service
    ) {}
}
