package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserBehaviorSignalEntity;
import interview.guide.modules.profile.entity.UserProfilePatternEntity;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:profile_completion;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnableJpaRepositories(basePackageClasses = {
    UserBehaviorSignalRepository.class,
    UserProfilePatternRepository.class
})
class UserProfileCompletionRepositoryTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private UserBehaviorSignalRepository behaviorSignalRepository;

    @Autowired
    private UserProfilePatternRepository profilePatternRepository;

    @Test
    void persistsAndFindsBehaviorSignalsWithJsonEvidence() {
        UserBehaviorSignalEntity entity = new UserBehaviorSignalEntity();
        entity.setUserId("default");
        entity.setNamespace("interview");
        entity.setSignalKey("java_generics");
        entity.setPolarity("WEAKNESS");
        entity.setStatement("Needs clearer generic type boundary explanations.");
        entity.setEvidenceJson(List.of(Map.of("source", "interview", "sessionId", 7)));
        entity.setSourceType("INTERVIEW");
        entity.setSourceSessionId(7L);
        entity.setStatus("ACTIVE");

        behaviorSignalRepository.saveAndFlush(entity);
        entityManager.clear();

        List<UserBehaviorSignalEntity> byUser = behaviorSignalRepository.findByUserId("default");
        List<UserBehaviorSignalEntity> byStatus = behaviorSignalRepository.findByUserIdAndStatus("default", "ACTIVE");
        List<UserBehaviorSignalEntity> byNamespace = behaviorSignalRepository.findByUserIdAndNamespaceAndStatus(
            "default",
            "interview",
            "ACTIVE"
        );
        UserBehaviorSignalEntity reloaded = behaviorSignalRepository.findByUserIdAndNamespaceAndSignalKey(
            "default",
            "interview",
            "java_generics"
        ).orElseThrow();

        assertEquals(1, byUser.size());
        assertEquals(1, byStatus.size());
        assertEquals(1, byNamespace.size());
        assertEquals(1L, behaviorSignalRepository.countByUserIdAndStatus("default", "ACTIVE"));
        assertEquals("interview", reloaded.getEvidenceJson().get(0).get("source"));
        assertEquals(7, ((Number) reloaded.getEvidenceJson().get(0).get("sessionId")).intValue());
    }

    @Test
    void persistsAndFindsProfilePatternsWithJsonCollections() {
        UserProfilePatternEntity entity = new UserProfilePatternEntity();
        entity.setUserId("default");
        entity.setPatternType("RECURRING_WEAKNESS");
        entity.setTitle("Concurrency explanations lack ordering detail");
        entity.setSummary("Often misses happens-before reasoning.");
        entity.setRelatedTopics(List.of("Java Concurrency"));
        entity.setRelatedSignalIds(List.of(10L, 11L));
        entity.setEvidenceJson(List.of(Map.of("signalKey", "happens_before")));
        entity.setConfidence(new BigDecimal("0.850"));
        entity.setStatus("ACTIVE");

        profilePatternRepository.saveAndFlush(entity);
        entityManager.clear();

        List<UserProfilePatternEntity> reloaded = profilePatternRepository
            .findByUserIdAndStatusOrderByLastSeenDesc("default", "ACTIVE");

        assertEquals(1, reloaded.size());
        assertEquals(1L, profilePatternRepository.countByUserIdAndStatus("default", "ACTIVE"));
        assertEquals(List.of("Java Concurrency"), reloaded.get(0).getRelatedTopics());
        assertEquals(List.of(10L, 11L), reloaded.get(0).getRelatedSignalIds());
        assertEquals("happens_before", reloaded.get(0).getEvidenceJson().get(0).get("signalKey"));
    }

    @Test
    void nullCollectionSettersResetToEmptyCollections() {
        UserBehaviorSignalEntity signal = new UserBehaviorSignalEntity();
        signal.setEvidenceJson(null);

        UserProfilePatternEntity pattern = new UserProfilePatternEntity();
        pattern.setRelatedTopics(null);
        pattern.setRelatedSignalIds(null);
        pattern.setEvidenceJson(null);

        assertTrue(signal.getEvidenceJson().isEmpty());
        assertTrue(pattern.getRelatedTopics().isEmpty());
        assertTrue(pattern.getRelatedSignalIds().isEmpty());
        assertTrue(pattern.getEvidenceJson().isEmpty());
    }
}
