package interview.guide.modules.interview.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 同一简历下的成长曲线数据
 */
public record GrowthCurveDTO(
    Long resumeId,
    List<JobRoleGrowthDTO> byJobRole
) {
    public record JobRoleGrowthDTO(
        JobRole jobRole,
        String jobLabel,
        List<ScorePointDTO> scorePoints
    ) {}

    public record ScorePointDTO(
        LocalDateTime date,
        int overallScore,
        List<CategoryScoreDTO> categoryScores
    ) {}

    public record CategoryScoreDTO(
        String category,
        int score
    ) {}
}
