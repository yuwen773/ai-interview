package interview.guide.modules.interview;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.guide.infrastructure.mapper.InterviewMapper;
import interview.guide.modules.interview.model.InterviewHistorySummaryDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.resume.model.ResumeEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewHistoryServiceTest {

    @Mock
    private InterviewPersistenceService interviewPersistenceService;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @Test
    void shouldReturnFlattenedInterviewHistorySummary() {
        InterviewHistoryService historyService = new InterviewHistoryService(
            interviewPersistenceService,
            null,
            new ObjectMapper(),
            Mappers.getMapper(InterviewMapper.class),
            interviewSessionRepository
        );
        when(interviewSessionRepository.findAllWithResumeOrderByCreatedAtDesc()).thenReturn(List.of(
            session("session-3", 3L, "resume-3.pdf", JobRole.JAVA_BACKEND, "Java 后端", 5,
                InterviewSessionEntity.SessionStatus.EVALUATED, "COMPLETED", 88,
                LocalDateTime.of(2026, 3, 21, 10, 0), LocalDateTime.of(2026, 3, 21, 10, 30)),
            session("session-2", 2L, "resume-2.pdf", JobRole.WEB_FRONTEND, null, 6,
                InterviewSessionEntity.SessionStatus.COMPLETED, "PENDING", 76,
                LocalDateTime.of(2026, 3, 20, 10, 0), LocalDateTime.of(2026, 3, 20, 10, 30)),
            session("session-1", 1L, "resume-1.pdf", JobRole.PYTHON_ALGORITHM, "Python 算法", 4,
                InterviewSessionEntity.SessionStatus.IN_PROGRESS, null, 100,
                LocalDateTime.of(2026, 3, 19, 10, 0), null)
        ));

        InterviewHistorySummaryDTO summary = historyService.getHistorySummary();

        assertThat(summary.stats().totalCount()).isEqualTo(3);
        assertThat(summary.stats().completedCount()).isEqualTo(2);
        assertThat(summary.stats().averageScore()).isEqualTo(82);
        assertThat(summary.items()).hasSize(3);
        assertThat(summary.items()).extracting(InterviewHistorySummaryDTO.Item::sessionId)
            .containsExactly("session-3", "session-2", "session-1");
        assertThat(summary.items().getFirst().resumeFilename()).isNotBlank();
        assertThat(summary.items().getFirst().status()).isEqualTo("EVALUATED");
        assertThat(summary.items().getFirst().evaluateStatus()).isEqualTo("COMPLETED");
        assertThat(summary.items().get(1).jobLabel()).isEqualTo("Web 前端");
        assertThat(summary.items().get(2).status()).isEqualTo("IN_PROGRESS");
        assertThat(summary.items().get(2).evaluateStatus()).isNull();
    }

    private InterviewSessionEntity session(
        String sessionId,
        Long resumeId,
        String resumeFilename,
        JobRole jobRole,
        String jobLabel,
        Integer totalQuestions,
        InterviewSessionEntity.SessionStatus status,
        String evaluateStatus,
        Integer overallScore,
        LocalDateTime createdAt,
        LocalDateTime completedAt
    ) {
        ResumeEntity resume = new ResumeEntity();
        resume.setId(resumeId);
        resume.setOriginalFilename(resumeFilename);

        InterviewSessionEntity session = new InterviewSessionEntity();
        session.setSessionId(sessionId);
        session.setResume(resume);
        session.setJobRole(jobRole);
        session.setJobLabelSnapshot(jobLabel);
        session.setTotalQuestions(totalQuestions);
        session.setStatus(status);
        session.setEvaluateStatus(evaluateStatus == null ? null : interview.guide.common.model.AsyncTaskStatus.valueOf(evaluateStatus));
        session.setOverallScore(overallScore);
        session.setCreatedAt(createdAt);
        session.setCompletedAt(completedAt);
        return session;
    }
}
