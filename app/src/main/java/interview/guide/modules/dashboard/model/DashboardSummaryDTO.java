package interview.guide.modules.dashboard.model;

import java.time.LocalDateTime;

/**
 * 仪表盘汇总数据DTO
 * 包含简历数量、面试统计和最近记录摘要
 */
public record DashboardSummaryDTO(
    int resumeCount,                    // 简历总数
    int totalInterviewCount,            // 面试总会话数
    int unfinishedInterviewCount,       // 未完成面试数
    LatestResumeSummary latestResume,   // 最新简历摘要
    LatestInterviewSummary latestInterview, // 最新面试摘要
    LatestReportSummary latestReport    // 最新评估报告摘要
) {

    /** 最新简历摘要 */
    public record LatestResumeSummary(
        Long id,                     // 简历ID
        String filename,             // 原始文件名
        LocalDateTime uploadedAt     // 上传时间
    ) {
    }

    /** 最新面试会话摘要 */
    public record LatestInterviewSummary(
        String sessionId,            // 会话UUID
        String status,               // 会话状态
        LocalDateTime createdAt,     // 创建时间
        LocalDateTime completedAt,   // 完成时间
        Integer overallScore         // 总评分
    ) {
    }

    /** 最新评估报告摘要 */
    public record LatestReportSummary(
        String sessionId,            // 关联会话UUID
        Integer overallScore,        // 总评分
        LocalDateTime completedAt    // 报告完成时间
    ) {
    }
}
