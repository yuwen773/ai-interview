package interview.guide.modules.dashboard;

import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.dashboard.service.DashboardSummaryService;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.repository.ResumeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardSummaryServiceTest {

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @InjectMocks
    private DashboardSummaryService service;

    @Test
    void shouldReturnLatestResumeAndInterviewSummary() {
        ResumeEntity latestResume = resume(2L, "latest-resume.pdf", LocalDateTime.of(2026, 3, 21, 11, 0));
        InterviewSessionEntity evaluatedInterview = interview(
            "session-evaluated",
            InterviewSessionEntity.SessionStatus.EVALUATED,
            LocalDateTime.of(2026, 3, 20, 9, 0),
            LocalDateTime.of(2026, 3, 20, 9, 30),
            92
        );
        InterviewSessionEntity latestInterview = interview(
            "session-latest",
            InterviewSessionEntity.SessionStatus.IN_PROGRESS,
            LocalDateTime.of(2026, 3, 21, 12, 0),
            null,
            null
        );

        when(resumeRepository.count()).thenReturn(2L);
        when(resumeRepository.findFirstByOrderByUploadedAtDesc()).thenReturn(Optional.of(latestResume));
        when(interviewSessionRepository.count()).thenReturn(3L);
        when(interviewSessionRepository.countByStatusIn(List.of(
            InterviewSessionEntity.SessionStatus.CREATED,
            InterviewSessionEntity.SessionStatus.IN_PROGRESS
        ))).thenReturn(1L);
        when(interviewSessionRepository.findFirstByOrderByCreatedAtDesc()).thenReturn(Optional.of(latestInterview));
        when(interviewSessionRepository.findFirstByStatusInAndOverallScoreIsNotNullOrderByCompletedAtDescCreatedAtDesc(
            List.of(
                InterviewSessionEntity.SessionStatus.COMPLETED,
                InterviewSessionEntity.SessionStatus.EVALUATED
            )
        )).thenReturn(Optional.of(evaluatedInterview));

        DashboardSummaryDTO summary = service.getSummary();

        assertThat(summary.resumeCount()).isEqualTo(2);
        assertThat(summary.totalInterviewCount()).isEqualTo(3);
        assertThat(summary.unfinishedInterviewCount()).isEqualTo(1);
        assertThat(summary.latestResume()).isNotNull();
        assertThat(summary.latestResume().id()).isEqualTo(2L);
        assertThat(summary.latestResume().filename()).isEqualTo("latest-resume.pdf");
        assertThat(summary.latestInterview()).isNotNull();
        assertThat(summary.latestInterview().sessionId()).isEqualTo("session-latest");
        assertThat(summary.latestInterview().status()).isEqualTo("IN_PROGRESS");
        assertThat(summary.latestReportScore()).isEqualTo(92);
    }

    @Test
    void shouldReturnEmptySummaryWhenNoResumeOrInterviewExists() {
        when(resumeRepository.count()).thenReturn(0L);
        when(resumeRepository.findFirstByOrderByUploadedAtDesc()).thenReturn(Optional.empty());
        when(interviewSessionRepository.count()).thenReturn(0L);
        when(interviewSessionRepository.countByStatusIn(List.of(
            InterviewSessionEntity.SessionStatus.CREATED,
            InterviewSessionEntity.SessionStatus.IN_PROGRESS
        ))).thenReturn(0L);
        when(interviewSessionRepository.findFirstByOrderByCreatedAtDesc()).thenReturn(Optional.empty());
        when(interviewSessionRepository.findFirstByStatusInAndOverallScoreIsNotNullOrderByCompletedAtDescCreatedAtDesc(
            List.of(
                InterviewSessionEntity.SessionStatus.COMPLETED,
                InterviewSessionEntity.SessionStatus.EVALUATED
            )
        )).thenReturn(Optional.empty());

        DashboardSummaryDTO summary = service.getSummary();

        assertThat(summary.resumeCount()).isZero();
        assertThat(summary.totalInterviewCount()).isZero();
        assertThat(summary.unfinishedInterviewCount()).isZero();
        assertThat(summary.latestResume()).isNull();
        assertThat(summary.latestInterview()).isNull();
        assertThat(summary.latestReportScore()).isNull();
    }

    @Test
    void shouldCountCreatedAndInProgressStatusesAsUnfinished() {
        when(resumeRepository.count()).thenReturn(0L);
        when(resumeRepository.findFirstByOrderByUploadedAtDesc()).thenReturn(Optional.empty());
        when(interviewSessionRepository.count()).thenReturn(4L);
        when(interviewSessionRepository.countByStatusIn(List.of(
            InterviewSessionEntity.SessionStatus.CREATED,
            InterviewSessionEntity.SessionStatus.IN_PROGRESS
        ))).thenReturn(2L);
        when(interviewSessionRepository.findFirstByOrderByCreatedAtDesc()).thenReturn(Optional.empty());
        when(interviewSessionRepository.findFirstByStatusInAndOverallScoreIsNotNullOrderByCompletedAtDescCreatedAtDesc(
            List.of(
                InterviewSessionEntity.SessionStatus.COMPLETED,
                InterviewSessionEntity.SessionStatus.EVALUATED
            )
        )).thenReturn(Optional.empty());

        DashboardSummaryDTO summary = service.getSummary();

        assertThat(summary.unfinishedInterviewCount()).isEqualTo(2);
        verify(interviewSessionRepository).countByStatusIn(List.of(
            InterviewSessionEntity.SessionStatus.CREATED,
            InterviewSessionEntity.SessionStatus.IN_PROGRESS
        ));
    }

    private ResumeEntity resume(Long id, String filename, LocalDateTime uploadedAt) {
        ResumeEntity resume = new ResumeEntity();
        resume.setId(id);
        resume.setOriginalFilename(filename);
        resume.setUploadedAt(uploadedAt);
        return resume;
    }

    private InterviewSessionEntity interview(
        String sessionId,
        InterviewSessionEntity.SessionStatus status,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        Integer overallScore
    ) {
        InterviewSessionEntity session = new InterviewSessionEntity();
        session.setSessionId(sessionId);
        session.setStatus(status);
        session.setCreatedAt(createdAt);
        session.setCompletedAt(completedAt);
        session.setOverallScore(overallScore);
        return session;
    }
}
