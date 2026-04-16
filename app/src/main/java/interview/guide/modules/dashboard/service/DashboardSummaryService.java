package interview.guide.modules.dashboard.service;

import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 仪表盘汇总服务
 * 聚合简历和面试数据，构建仪表盘展示所需的汇总信息
 */
@Service
@RequiredArgsConstructor
public class DashboardSummaryService {

    // 未完成的面试状态
    private static final List<InterviewSessionEntity.SessionStatus> UNFINISHED_STATUSES = List.of(
        InterviewSessionEntity.SessionStatus.CREATED,
        InterviewSessionEntity.SessionStatus.IN_PROGRESS
    );

    // 已出分的面试状态（有评估报告）
    private static final List<InterviewSessionEntity.SessionStatus> SCORED_STATUSES = List.of(
        InterviewSessionEntity.SessionStatus.COMPLETED,
        InterviewSessionEntity.SessionStatus.EVALUATED
    );

    private final ResumeRepository resumeRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    /**
     * 获取仪表盘汇总数据
     * 查询简历数量、面试数量、最新简历/面试/报告
     */
    public DashboardSummaryDTO getSummary() {
        DashboardSummaryDTO.LatestResumeSummary latestResume = resumeRepository.findFirstByOrderByUploadedAtDesc()
            .map(this::toLatestResumeSummary)
            .orElse(null);
        DashboardSummaryDTO.LatestInterviewSummary latestInterview = interviewSessionRepository.findFirstByOrderByCreatedAtDesc()
            .map(this::toLatestInterviewSummary)
            .orElse(null);
        DashboardSummaryDTO.LatestReportSummary latestReport = interviewSessionRepository
            .findFirstByStatusInAndOverallScoreIsNotNullOrderByCompletedAtDescCreatedAtDesc(SCORED_STATUSES)
            .map(this::toLatestReportSummary)
            .orElse(null);

        return new DashboardSummaryDTO(
            Math.toIntExact(resumeRepository.count()),
            Math.toIntExact(interviewSessionRepository.count()),
            Math.toIntExact(interviewSessionRepository.countByStatusIn(UNFINISHED_STATUSES)),
            latestResume,
            latestInterview,
            latestReport
        );
    }

    /** 简历实体转最新简历摘要 */
    private DashboardSummaryDTO.LatestResumeSummary toLatestResumeSummary(ResumeEntity resume) {
        return new DashboardSummaryDTO.LatestResumeSummary(
            resume.getId(),
            resume.getOriginalFilename(),
            resume.getUploadedAt()
        );
    }

    /** 面试会话实体转最新面试摘要 */
    private DashboardSummaryDTO.LatestInterviewSummary toLatestInterviewSummary(InterviewSessionEntity session) {
        return new DashboardSummaryDTO.LatestInterviewSummary(
            session.getSessionId(),
            session.getStatus() == null ? null : session.getStatus().name(),
            session.getCreatedAt(),
            session.getCompletedAt(),
            session.getOverallScore()
        );
    }

    /** 面试会话实体转最新报告摘要 */
    private DashboardSummaryDTO.LatestReportSummary toLatestReportSummary(InterviewSessionEntity session) {
        return new DashboardSummaryDTO.LatestReportSummary(
            session.getSessionId(),
            session.getOverallScore(),
            session.getCompletedAt()
        );
    }
}
