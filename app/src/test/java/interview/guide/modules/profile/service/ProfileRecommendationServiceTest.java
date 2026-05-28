package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserTopicMasteryEntity;
import interview.guide.modules.profile.model.WeakPointStatus;
import interview.guide.modules.profile.model.dto.BehaviorSignalDto;
import interview.guide.modules.profile.model.dto.ProfilePatternDto;
import interview.guide.modules.profile.model.dto.ProfileRecommendationDto;
import interview.guide.modules.profile.model.dto.WeakPointDto;
import interview.guide.modules.profile.repository.UserTopicMasteryRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfileRecommendationServiceTest {

    @Test
    void shouldRecommendDueWeakPointFirst() {
        UserProfileService profileService = mock(UserProfileService.class);
        UserTopicMasteryRepository masteryRepository = mock(UserTopicMasteryRepository.class);
        BehaviorSignalService behaviorSignalService = mock(BehaviorSignalService.class);
        ProfileConsolidationService consolidationService = mock(ProfileConsolidationService.class);
        ProfileRecommendationService service = new ProfileRecommendationService(
            profileService,
            masteryRepository,
            behaviorSignalService,
            consolidationService
        );
        when(profileService.getWeakPointDtos("default", WeakPointStatus.DUE, null))
            .thenReturn(List.of(weakPoint("Redis")));
        when(masteryRepository.findByUserId("default")).thenReturn(List.of(mastery("JVM", 45)));
        when(behaviorSignalService.getSignals("default", null, null))
            .thenReturn(List.of(signal("communication_missing_example", "NEGATIVE")));
        when(consolidationService.getPatterns("default", "ACTIVE"))
            .thenReturn(List.of(pattern("长期模式")));

        List<ProfileRecommendationDto> result = service.getRecommendations("default");

        assertEquals("WEAK_POINT_REVIEW", result.get(0).type());
        assertEquals(10, result.get(0).priority());
    }

    @Test
    void shouldExcludeResolvedNegativeBehaviorSignals() {
        UserProfileService profileService = mock(UserProfileService.class);
        UserTopicMasteryRepository masteryRepository = mock(UserTopicMasteryRepository.class);
        BehaviorSignalService behaviorSignalService = mock(BehaviorSignalService.class);
        ProfileConsolidationService consolidationService = mock(ProfileConsolidationService.class);
        ProfileRecommendationService service = new ProfileRecommendationService(
            profileService,
            masteryRepository,
            behaviorSignalService,
            consolidationService
        );
        when(profileService.getWeakPointDtos("default", WeakPointStatus.DUE, null)).thenReturn(List.of());
        when(masteryRepository.findByUserId("default")).thenReturn(List.of());
        when(consolidationService.getPatterns("default", "ACTIVE")).thenReturn(List.of());
        when(behaviorSignalService.getSignals("default", null, null))
            .thenReturn(List.of(
                signal("active_negative", "NEGATIVE", "ACTIVE"),
                signal("improving_signal", "NEGATIVE", "IMPROVING"),
                signal("improved_negative", "NEGATIVE", "IMPROVED"),
                signal("archived_negative", "NEGATIVE", "ARCHIVED")
            ));

        List<ProfileRecommendationDto> result = service.getRecommendations("default");

        assertEquals(
            List.of("练习表现：active_negative", "练习表现：improving_signal"),
            result.stream().map(ProfileRecommendationDto::title).toList()
        );
    }

    private static WeakPointDto weakPoint(String topic) {
        return new WeakPointDto(
            1L,
            topic,
            "缓存一致性回答缺少异常场景",
            "补充异常场景",
            5.0,
            "INTERVIEW",
            1L,
            LocalDate.now(),
            2.5,
            0,
            1,
            false
        );
    }

    private static UserTopicMasteryEntity mastery(String topic, double score) {
        UserTopicMasteryEntity entity = new UserTopicMasteryEntity();
        entity.setUserId("default");
        entity.setTopic(topic);
        entity.setScore(BigDecimal.valueOf(score));
        entity.setSessionCount(1);
        return entity;
    }

    private static BehaviorSignalDto signal(String key, String polarity) {
        return signal(key, polarity, "ACTIVE");
    }

    private static BehaviorSignalDto signal(String key, String polarity, String status) {
        return new BehaviorSignalDto(1L, "communication", key, polarity, "回答缺少例子", List.of(), 1, status, null);
    }

    private static ProfilePatternDto pattern(String title) {
        return new ProfilePatternDto(1L, "BEHAVIOR_RISK", title, "多个主题重复出现", List.of("Redis"), List.of(1L), 0.75, "ACTIVE", null);
    }
}
