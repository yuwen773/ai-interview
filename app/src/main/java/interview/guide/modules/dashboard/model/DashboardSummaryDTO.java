package interview.guide.modules.dashboard.model;

import interview.guide.modules.interview.model.InterviewSessionEntity;

import java.time.LocalDateTime;

public record DashboardSummaryDTO(
    int resumeCount,
    int totalInterviewCount,
    int unfinishedInterviewCount,
    LatestResumeSummary latestResume,
    LatestInterviewSummary latestInterview,
    Integer latestReportScore
) {

    public record LatestResumeSummary(
        Long id,
        String filename,
        LocalDateTime uploadedAt
    ) {
    }

    public record LatestInterviewSummary(
        String sessionId,
        InterviewSessionEntity.SessionStatus status,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        Integer overallScore
    ) {
    }
}
