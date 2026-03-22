package interview.guide.modules.dashboard.service;

import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardSummaryService {

    private static final List<InterviewSessionEntity.SessionStatus> UNFINISHED_STATUSES = List.of(
        InterviewSessionEntity.SessionStatus.CREATED,
        InterviewSessionEntity.SessionStatus.IN_PROGRESS
    );

    private static final List<InterviewSessionEntity.SessionStatus> SCORED_STATUSES = List.of(
        InterviewSessionEntity.SessionStatus.COMPLETED,
        InterviewSessionEntity.SessionStatus.EVALUATED
    );

    private final ResumeRepository resumeRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    public DashboardSummaryDTO getSummary() {
        DashboardSummaryDTO.LatestResumeSummary latestResume = resumeRepository.findFirstByOrderByUploadedAtDesc()
            .map(this::toLatestResumeSummary)
            .orElse(null);
        DashboardSummaryDTO.LatestInterviewSummary latestInterview = interviewSessionRepository.findFirstByOrderByCreatedAtDesc()
            .map(this::toLatestInterviewSummary)
            .orElse(null);
        Integer latestReportScore = interviewSessionRepository
            .findFirstByStatusInAndOverallScoreIsNotNullOrderByCompletedAtDescCreatedAtDesc(SCORED_STATUSES)
            .map(InterviewSessionEntity::getOverallScore)
            .orElse(null);

        return new DashboardSummaryDTO(
            Math.toIntExact(resumeRepository.count()),
            Math.toIntExact(interviewSessionRepository.count()),
            Math.toIntExact(interviewSessionRepository.countByStatusIn(UNFINISHED_STATUSES)),
            latestResume,
            latestInterview,
            latestReportScore
        );
    }

    private DashboardSummaryDTO.LatestResumeSummary toLatestResumeSummary(ResumeEntity resume) {
        return new DashboardSummaryDTO.LatestResumeSummary(
            resume.getId(),
            resume.getOriginalFilename(),
            resume.getUploadedAt()
        );
    }

    private DashboardSummaryDTO.LatestInterviewSummary toLatestInterviewSummary(InterviewSessionEntity session) {
        return new DashboardSummaryDTO.LatestInterviewSummary(
            session.getSessionId(),
            session.getStatus(),
            session.getCreatedAt(),
            session.getCompletedAt(),
            session.getOverallScore()
        );
    }
}
