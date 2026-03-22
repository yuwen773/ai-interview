package interview.guide.modules.dashboard.model;

import java.time.LocalDateTime;

public record DashboardSummaryDTO(
    int resumeCount,
    int totalInterviewCount,
    int unfinishedInterviewCount,
    LatestResumeSummary latestResume,
    LatestInterviewSummary latestInterview,
    LatestReportSummary latestReport
) {

    public record LatestResumeSummary(
        Long id,
        String filename,
        LocalDateTime uploadedAt
    ) {
    }

    public record LatestInterviewSummary(
        String sessionId,
        String status,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        Integer overallScore
    ) {
    }

    public record LatestReportSummary(
        String sessionId,
        Integer overallScore,
        LocalDateTime completedAt
    ) {
    }
}
