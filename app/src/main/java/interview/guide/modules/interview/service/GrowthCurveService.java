package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.GrowthCurveDTO;
import interview.guide.modules.interview.model.InterviewAnswerEntity;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.model.JobRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 成长曲线查询服务
 */
@Service
@RequiredArgsConstructor
public class GrowthCurveService {

    private final InterviewPersistenceService persistenceService;

    public GrowthCurveDTO getGrowthCurve(Long resumeId) {
        List<InterviewSessionEntity> sessions = persistenceService.findSessionsForGrowthCurve(resumeId);

        Map<JobRole, List<GrowthCurveDTO.ScorePointDTO>> pointsByRole = sessions.stream()
            .filter(session -> session.getJobRole() != null)
            .map(this::toPoint)
            .filter(Objects::nonNull)
            .sorted(Comparator.comparing(point -> point.scorePoint().date()))
            .collect(java.util.stream.Collectors.groupingBy(
                point -> point.jobRole(),
                LinkedHashMap::new,
                java.util.stream.Collectors.mapping(GrowthCurvePoint::scorePoint, java.util.stream.Collectors.toList())
            ));

        List<GrowthCurveDTO.JobRoleGrowthDTO> byJobRole = pointsByRole.entrySet().stream()
            .map(entry -> new GrowthCurveDTO.JobRoleGrowthDTO(
                entry.getKey(),
                entry.getKey().getLabel(),
                entry.getValue()
            ))
            .toList();

        return new GrowthCurveDTO(resumeId, byJobRole);
    }

    private GrowthCurvePoint toPoint(InterviewSessionEntity session) {
        List<InterviewAnswerEntity> scoredAnswers = session.getAnswers() == null
            ? List.of()
            : session.getAnswers().stream()
                .filter(answer -> answer.getScore() != null)
                .toList();

        Integer overallScore = session.getOverallScore();
        if (overallScore == null) {
            overallScore = averageScore(scoredAnswers.stream().map(InterviewAnswerEntity::getScore).toList());
        }
        if (overallScore == null) {
            return null;
        }

        List<GrowthCurveDTO.CategoryScoreDTO> categoryScores = scoredAnswers.stream()
            .filter(answer -> answer.getCategory() != null && !answer.getCategory().isBlank())
            .collect(java.util.stream.Collectors.groupingBy(
                InterviewAnswerEntity::getCategory,
                LinkedHashMap::new,
                java.util.stream.Collectors.mapping(InterviewAnswerEntity::getScore, java.util.stream.Collectors.toList())
            ))
            .entrySet()
            .stream()
            .map(entry -> new GrowthCurveDTO.CategoryScoreDTO(entry.getKey(), averageScore(entry.getValue())))
            .sorted(Comparator.comparing(GrowthCurveDTO.CategoryScoreDTO::category))
            .toList();

        LocalDateTime pointDate = session.getCompletedAt() != null ? session.getCompletedAt() : session.getCreatedAt();

        return new GrowthCurvePoint(
            session.getJobRole(),
            new GrowthCurveDTO.ScorePointDTO(pointDate, overallScore, categoryScores)
        );
    }

    private Integer averageScore(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) {
            return null;
        }
        return (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private record GrowthCurvePoint(JobRole jobRole, GrowthCurveDTO.ScorePointDTO scorePoint) {
    }
}
