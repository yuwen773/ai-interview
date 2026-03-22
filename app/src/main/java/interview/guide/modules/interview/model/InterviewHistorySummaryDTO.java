package interview.guide.modules.interview.model;

import java.time.LocalDateTime;
import java.util.List;

public record InterviewHistorySummaryDTO(
    Stats stats,
    List<Item> items
) {
    public record Stats(int totalCount, int completedCount, int averageScore) {}

    public record Item(
        String sessionId,
        Long resumeId,
        String resumeFilename,
        JobRole jobRole,
        String jobLabel,
        Integer totalQuestions,
        String status,
        String evaluateStatus,
        Integer overallScore,
        LocalDateTime createdAt,
        LocalDateTime completedAt
    ) {}
}
