package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.model.WeakPointStatus;
import interview.guide.modules.profile.model.dto.WeakPointDto;
import interview.guide.modules.profile.repository.UserProfileRepository;
import interview.guide.modules.profile.repository.UserStrongPointRepository;
import interview.guide.modules.profile.repository.UserTopicMasteryRepository;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserProfileServiceWeakPointStatusTest {

    @Test
    void shouldQueryImprovedWeakPoints() {
        UserWeakPointRepository weakRepo = mock(UserWeakPointRepository.class);
        UserProfileService service = serviceWith(weakRepo);
        when(weakRepo.findByUserIdAndIsImprovedTrue("default"))
            .thenReturn(List.of(weakPoint("Redis", true)));

        List<WeakPointDto> result = service.getWeakPointDtos("default", WeakPointStatus.IMPROVED, null);

        assertEquals(1, result.size());
        assertTrue(result.get(0).isImproved());
    }

    @Test
    void shouldQueryActiveWeakPointsByTopic() {
        UserWeakPointRepository weakRepo = mock(UserWeakPointRepository.class);
        UserProfileService service = serviceWith(weakRepo);
        when(weakRepo.findByUserIdAndTopicAndIsImprovedFalse("default", "Redis"))
            .thenReturn(List.of(weakPoint("Redis", false)));

        List<WeakPointDto> result = service.getWeakPointDtos("default", WeakPointStatus.ACTIVE, "Redis");

        assertEquals(1, result.size());
        assertEquals("Redis", result.get(0).topic());
    }

    @Test
    void shouldQueryDueWeakPointsWithBlankTopicAsNull() {
        UserWeakPointRepository weakRepo = mock(UserWeakPointRepository.class);
        UserProfileService service = serviceWith(weakRepo);
        when(weakRepo.findDueReviewsOptionalTopic(eq("default"), eq(null), any(LocalDate.class)))
            .thenReturn(List.of(weakPoint("JVM", false)));

        List<WeakPointDto> result = service.getWeakPointDtos("default", WeakPointStatus.DUE, " ");

        assertEquals(1, result.size());
        verify(weakRepo).findDueReviewsOptionalTopic(eq("default"), eq(null), any(LocalDate.class));
    }

    private static UserProfileService serviceWith(UserWeakPointRepository weakRepo) {
        return new UserProfileService(
            weakRepo,
            mock(UserTopicMasteryRepository.class),
            mock(UserProfileRepository.class),
            mock(SpacedRepetitionService.class),
            mock(UserStrongPointRepository.class),
            mock(ProfileSemanticService.class)
        );
    }

    private static UserWeakPointEntity weakPoint(String topic, boolean improved) {
        UserWeakPointEntity entity = new UserWeakPointEntity();
        entity.setId(1L);
        entity.setUserId("default");
        entity.setTopic(topic);
        entity.setQuestionText(topic + " question");
        entity.setAnswerSummary("answer summary");
        entity.setScore(BigDecimal.valueOf(5));
        entity.setSource("INTERVIEW");
        entity.setSessionId(10L);
        entity.setSrState(Map.of(
            "next_review", LocalDate.now().toString(),
            "ease_factor", 2.5,
            "repetitions", 1
        ));
        entity.setTimesSeen(2);
        entity.setImproved(improved);
        return entity;
    }
}
