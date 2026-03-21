package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.GrowthCurveDTO;
import interview.guide.modules.interview.model.InterviewAnswerEntity;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.model.JobRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("成长曲线服务测试")
class GrowthCurveServiceTest {

    @Test
    @DisplayName("应按岗位分组并按时间排序，同时从答案聚合分类分数")
    void shouldGroupPointsByJobRoleAndAggregateCategoryScores() {
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        GrowthCurveService service = new GrowthCurveService(persistenceService);

        InterviewSessionEntity javaOld = createSession(
            JobRole.JAVA_BACKEND,
            78,
            LocalDateTime.of(2026, 3, 10, 9, 0),
            List.of(
                createAnswer("基础", 70),
                createAnswer("基础", 80),
                createAnswer("项目", 85)
            )
        );
        InterviewSessionEntity javaNew = createSession(
            JobRole.JAVA_BACKEND,
            null,
            LocalDateTime.of(2026, 3, 12, 10, 0),
            List.of(
                createAnswer("基础", 90),
                createAnswer("系统设计", 80)
            )
        );
        InterviewSessionEntity frontend = createSession(
            JobRole.WEB_FRONTEND,
            88,
            LocalDateTime.of(2026, 3, 11, 11, 0),
            List.of(
                createAnswer("浏览器", 86),
                createAnswer("工程化", 90)
            )
        );

        when(persistenceService.findSessionsForGrowthCurve(99L)).thenReturn(List.of(javaNew, frontend, javaOld));

        GrowthCurveDTO dto = service.getGrowthCurve(99L);

        assertEquals(99L, dto.resumeId());
        assertEquals(2, dto.byJobRole().size());

        GrowthCurveDTO.JobRoleGrowthDTO javaSeries = dto.byJobRole().stream()
            .filter(item -> item.jobRole() == JobRole.JAVA_BACKEND)
            .findFirst()
            .orElseThrow();
        assertEquals(2, javaSeries.scorePoints().size());
        assertEquals(LocalDateTime.of(2026, 3, 10, 9, 0), javaSeries.scorePoints().get(0).date());
        assertEquals(78, javaSeries.scorePoints().get(0).overallScore());
        assertEquals(85, javaSeries.scorePoints().get(1).overallScore());
        assertEquals(75, javaSeries.scorePoints().get(0).categoryScores().stream()
            .filter(score -> "基础".equals(score.category()))
            .findFirst()
            .orElseThrow()
            .score());

        GrowthCurveDTO.JobRoleGrowthDTO frontendSeries = dto.byJobRole().stream()
            .filter(item -> item.jobRole() == JobRole.WEB_FRONTEND)
            .findFirst()
            .orElseThrow();
        assertEquals(1, frontendSeries.scorePoints().size());
        assertEquals(88, frontendSeries.scorePoints().get(0).overallScore());
    }

    @Test
    @DisplayName("没有岗位或分数的历史记录应被忽略")
    void shouldSkipSessionsWithoutJobRoleOrScores() {
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        GrowthCurveService service = new GrowthCurveService(persistenceService);

        InterviewSessionEntity noJobRole = createSession(
            null,
            80,
            LocalDateTime.of(2026, 3, 10, 9, 0),
            List.of(createAnswer("基础", 80))
        );
        InterviewSessionEntity noScore = createSession(
            JobRole.PYTHON_ALGORITHM,
            null,
            LocalDateTime.of(2026, 3, 11, 9, 0),
            List.of()
        );

        when(persistenceService.findSessionsForGrowthCurve(7L)).thenReturn(List.of(noJobRole, noScore));

        GrowthCurveDTO dto = service.getGrowthCurve(7L);

        assertEquals(0, dto.byJobRole().size());
    }

    private InterviewSessionEntity createSession(
        JobRole jobRole,
        Integer overallScore,
        LocalDateTime completedAt,
        List<InterviewAnswerEntity> answers
    ) {
        InterviewSessionEntity session = new InterviewSessionEntity();
        session.setJobRole(jobRole);
        session.setOverallScore(overallScore);
        session.setCreatedAt(completedAt.minusHours(1));
        session.setCompletedAt(completedAt);
        session.setAnswers(answers);
        return session;
    }

    private InterviewAnswerEntity createAnswer(String category, int score) {
        InterviewAnswerEntity answer = new InterviewAnswerEntity();
        answer.setCategory(category);
        answer.setScore(score);
        return answer;
    }
}
