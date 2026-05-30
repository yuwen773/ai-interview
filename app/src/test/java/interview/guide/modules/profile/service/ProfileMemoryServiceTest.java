package interview.guide.modules.profile.service;

import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.profile.model.dto.ProfileExtractResult;
import interview.guide.modules.profile.model.dto.ProfileUpdateResult;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileMemoryServiceTest {

    @Test
    void shouldContinueWhenBehaviorSignalApplyFails() {
        InterviewSessionRepository sessionRepo = mock(InterviewSessionRepository.class);
        ProfileExtractService extractService = mock(ProfileExtractService.class);
        ProfileUpdateService updateService = mock(ProfileUpdateService.class);
        BehaviorSignalService behaviorSignalService = mock(BehaviorSignalService.class);
        ProfileConsolidationService consolidationService = mock(ProfileConsolidationService.class);
        ProfileMemoryService service = new ProfileMemoryService(
            sessionRepo,
            extractService,
            updateService,
            behaviorSignalService,
            consolidationService
        );
        ProfileExtractResult extraction = new ProfileExtractResult(
            List.of(weakInsight()),
            List.of(strengthInsight()),
            List.of(signalInsight())
        );
        ProfileUpdateResult updateResult = new ProfileUpdateResult(List.of(), List.of(), List.of());
        when(sessionRepo.findBySessionId("session-id")).thenReturn(Optional.of(session(1L)));
        when(extractService.extractFromSession(1L, "default")).thenReturn(extraction);
        when(updateService.decideUpdates("default", extraction)).thenReturn(updateResult);
        when(behaviorSignalService.applyInsights(eq("default"), any(), eq(1L)))
            .thenThrow(new RuntimeException("signal failed"));

        service.extractAndUpdate("session-id", "default");

        verify(updateService).applyOperations("default", updateResult, 1L);
    }

    @Test
    void shouldApplyBehaviorSignalsWhenWeakAndStrongInsightsAreEmpty() {
        InterviewSessionRepository sessionRepo = mock(InterviewSessionRepository.class);
        ProfileExtractService extractService = mock(ProfileExtractService.class);
        ProfileUpdateService updateService = mock(ProfileUpdateService.class);
        BehaviorSignalService behaviorSignalService = mock(BehaviorSignalService.class);
        ProfileConsolidationService consolidationService = mock(ProfileConsolidationService.class);
        ProfileMemoryService service = new ProfileMemoryService(
            sessionRepo,
            extractService,
            updateService,
            behaviorSignalService,
            consolidationService
        );
        ProfileExtractResult extraction = new ProfileExtractResult(
            List.of(),
            List.of(),
            List.of(signalInsight())
        );
        ProfileUpdateResult updateResult = new ProfileUpdateResult(List.of(), List.of(), List.of());
        when(sessionRepo.findBySessionId("session-id")).thenReturn(Optional.of(session(1L)));
        when(extractService.extractFromSession(1L, "default")).thenReturn(extraction);
        when(updateService.decideUpdates("default", extraction)).thenReturn(updateResult);

        service.extractAndUpdate("session-id", "default");

        verify(behaviorSignalService).applyInsights(eq("default"), eq(extraction.behaviorSignals()), eq(1L));
    }

    private static InterviewSessionEntity session(Long id) {
        InterviewSessionEntity session = new InterviewSessionEntity();
        session.setId(id);
        session.setSessionId("session-id");
        return session;
    }

    private static ProfileExtractResult.WeakPointInsight weakInsight() {
        return new ProfileExtractResult.WeakPointInsight(
            "Redis",
            "如何处理缓存一致性？",
            "需要补充异常场景",
            5.0
        );
    }

    private static ProfileExtractResult.StrengthInsight strengthInsight() {
        return new ProfileExtractResult.StrengthInsight("Java", "线程池参数解释清晰");
    }

    private static ProfileExtractResult.BehaviorSignalInsight signalInsight() {
        return new ProfileExtractResult.BehaviorSignalInsight(
            "communication",
            "communication_missing_example",
            "NEGATIVE",
            "回答有结论但缺少例子",
            List.of(new ProfileExtractResult.BehaviorSignalEvidence("Redis", null, "缺少例子")),
            0.9
        );
    }
}
