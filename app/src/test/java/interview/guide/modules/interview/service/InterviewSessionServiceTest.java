package interview.guide.modules.interview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.model.AsyncTaskStatus;
import interview.guide.infrastructure.redis.InterviewSessionCache;
import interview.guide.modules.interview.listener.EvaluateStreamProducer;
import interview.guide.modules.interview.model.CreateInterviewRequest;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.InterviewReportDTO;
import interview.guide.modules.interview.model.InterviewSessionDTO;
import interview.guide.modules.interview.model.JobRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("面试会话服务测试")
class InterviewSessionServiceTest {

    @Test
    @DisplayName("存在未完成会话时应返回旧岗位会话且不重新生成题目")
    void shouldReuseUnfinishedSessionWithOriginalJobRole() {
        InterviewQuestionService questionService = mock(InterviewQuestionService.class);
        AnswerEvaluationService evaluationService = mock(AnswerEvaluationService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewSessionCache sessionCache = mock(InterviewSessionCache.class);
        EvaluateStreamProducer evaluateStreamProducer = mock(EvaluateStreamProducer.class);
        ObjectMapper objectMapper = new ObjectMapper();
        InterviewSessionService service = new InterviewSessionService(
            questionService,
            evaluationService,
            persistenceService,
            sessionCache,
            objectMapper,
            evaluateStreamProducer
        );

        InterviewSessionCache.CachedSession cachedSession = new InterviewSessionCache.CachedSession(
            "session-old",
            "resume-text",
            1L,
            JobRole.JAVA_BACKEND,
            "Java 后端",
            List.of(InterviewQuestionDTO.create(0, "介绍项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目经历")),
            0,
            InterviewSessionDTO.SessionStatus.CREATED,
            objectMapper
        );
        when(sessionCache.findUnfinishedSessionId(1L)).thenReturn(Optional.of("session-old"));
        when(sessionCache.getSession("session-old")).thenReturn(Optional.of(cachedSession));

        InterviewSessionDTO dto = service.createSession(
            new CreateInterviewRequest("resume-text", 5, 1L, JobRole.WEB_FRONTEND, false)
        );

        assertEquals("session-old", dto.sessionId());
        assertEquals(JobRole.JAVA_BACKEND, dto.jobRole());
        assertEquals("Java 后端", dto.jobLabel());
        verify(questionService, never()).generateQuestions(any(), any(), anyInt(), any());
        verify(persistenceService, never()).saveSession(any(), any(), any(), any(), anyInt(), any());
    }

    @Test
    @DisplayName("缓存状态仍为COMPLETED但数据库已有报告时应直接复用")
    void shouldReusePersistedReportWhenCacheStatusIsCompleted() {
        InterviewQuestionService questionService = mock(InterviewQuestionService.class);
        AnswerEvaluationService evaluationService = mock(AnswerEvaluationService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewSessionCache sessionCache = mock(InterviewSessionCache.class);
        EvaluateStreamProducer evaluateStreamProducer = mock(EvaluateStreamProducer.class);
        ObjectMapper objectMapper = new ObjectMapper();
        InterviewSessionService service = new InterviewSessionService(
            questionService,
            evaluationService,
            persistenceService,
            sessionCache,
            objectMapper,
            evaluateStreamProducer
        );

        InterviewSessionCache.CachedSession cachedSession = new InterviewSessionCache.CachedSession(
            "session-4",
            "resume-text",
            1L,
            JobRole.JAVA_BACKEND,
            "Java 后端",
            List.of(InterviewQuestionDTO.create(0, "介绍项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目经历")),
            1,
            InterviewSessionDTO.SessionStatus.COMPLETED,
            objectMapper
        );
        InterviewReportDTO persistedReport = new InterviewReportDTO(
            "session-4",
            JobRole.JAVA_BACKEND,
            "Java 后端",
            1,
            91,
            List.of(),
            List.of(),
            "总体评价",
            List.of("亮点"),
            List.of("建议"),
            List.of()
        );

        when(sessionCache.getSession("session-4")).thenReturn(Optional.of(cachedSession));
        when(persistenceService.getPersistedReport("session-4")).thenReturn(Optional.of(persistedReport));

        InterviewReportDTO report = service.generateReport("session-4");

        assertEquals(91, report.overallScore());
        verify(persistenceService).getPersistedReport("session-4");
        verify(evaluationService, never()).evaluateInterview(any(), any(), any());
        verify(persistenceService, never()).saveReport(any(), any());
    }

    @Test
    @DisplayName("生成报告时应带上缓存中的岗位信息")
    void shouldAttachJobInfoToReport() {
        InterviewQuestionService questionService = mock(InterviewQuestionService.class);
        AnswerEvaluationService evaluationService = mock(AnswerEvaluationService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewSessionCache sessionCache = mock(InterviewSessionCache.class);
        EvaluateStreamProducer evaluateStreamProducer = mock(EvaluateStreamProducer.class);
        ObjectMapper objectMapper = new ObjectMapper();
        InterviewSessionService service = new InterviewSessionService(
            questionService,
            evaluationService,
            persistenceService,
            sessionCache,
            objectMapper,
            evaluateStreamProducer
        );

        List<InterviewQuestionDTO> questions = List.of(
            InterviewQuestionDTO.create(0, "介绍项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目经历").withAnswer("回答")
        );
        InterviewSessionCache.CachedSession cachedSession = new InterviewSessionCache.CachedSession(
            "session-1",
            "resume-text",
            1L,
            JobRole.PYTHON_ALGORITHM,
            "Python 算法",
            questions,
            1,
            InterviewSessionDTO.SessionStatus.COMPLETED,
            objectMapper
        );
        InterviewReportDTO rawReport = new InterviewReportDTO(
            "session-1",
            null,
            null,
            1,
            85,
            List.of(),
            List.of(),
            "表现良好",
            List.of("逻辑清晰"),
            List.of("补充边界条件"),
            List.of()
        );
        when(sessionCache.getSession("session-1")).thenReturn(Optional.of(cachedSession));
        when(evaluationService.evaluateInterview("session-1", "resume-text", questions)).thenReturn(rawReport);

        InterviewReportDTO report = service.generateReport("session-1");

        assertEquals(JobRole.PYTHON_ALGORITHM, report.jobRole());
        assertEquals("Python 算法", report.jobLabel());
        assertEquals(85, report.overallScore());
        verify(persistenceService).saveReport("session-1", report);
    }

    @Test
    @DisplayName("已评估的会话应直接返回持久化报告且不重复评估")
    void shouldReusePersistedReportWhenSessionAlreadyEvaluated() {
        InterviewQuestionService questionService = mock(InterviewQuestionService.class);
        AnswerEvaluationService evaluationService = mock(AnswerEvaluationService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewSessionCache sessionCache = mock(InterviewSessionCache.class);
        EvaluateStreamProducer evaluateStreamProducer = mock(EvaluateStreamProducer.class);
        ObjectMapper objectMapper = new ObjectMapper();
        InterviewSessionService service = new InterviewSessionService(
            questionService,
            evaluationService,
            persistenceService,
            sessionCache,
            objectMapper,
            evaluateStreamProducer
        );

        InterviewSessionCache.CachedSession cachedSession = new InterviewSessionCache.CachedSession(
            "session-2",
            "resume-text",
            1L,
            JobRole.JAVA_BACKEND,
            "Java 后端",
            List.of(InterviewQuestionDTO.create(0, "介绍项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目经历")),
            1,
            InterviewSessionDTO.SessionStatus.EVALUATED,
            objectMapper
        );
        InterviewReportDTO persistedReport = new InterviewReportDTO(
            "session-2",
            JobRole.JAVA_BACKEND,
            "Java 后端",
            1,
            88,
            List.of(),
            List.of(),
            "总体评价",
            List.of("亮点"),
            List.of("建议"),
            List.of()
        );

        when(sessionCache.getSession("session-2")).thenReturn(Optional.of(cachedSession));
        when(persistenceService.getPersistedReport("session-2")).thenReturn(Optional.of(persistedReport));

        InterviewReportDTO report = service.generateReport("session-2");

        assertEquals(88, report.overallScore());
        verify(persistenceService).getPersistedReport("session-2");
        verify(evaluationService, never()).evaluateInterview(any(), any(), any());
        verify(persistenceService, never()).saveReport(any(), any());
    }

    @Test
    @DisplayName("异步评估进行中时不应重复触发同步评估")
    void shouldNotRegenerateReportWhileAsyncEvaluationIsProcessing() {
        InterviewQuestionService questionService = mock(InterviewQuestionService.class);
        AnswerEvaluationService evaluationService = mock(AnswerEvaluationService.class);
        InterviewPersistenceService persistenceService = mock(InterviewPersistenceService.class);
        InterviewSessionCache sessionCache = mock(InterviewSessionCache.class);
        EvaluateStreamProducer evaluateStreamProducer = mock(EvaluateStreamProducer.class);
        ObjectMapper objectMapper = new ObjectMapper();
        InterviewSessionService service = new InterviewSessionService(
            questionService,
            evaluationService,
            persistenceService,
            sessionCache,
            objectMapper,
            evaluateStreamProducer
        );

        InterviewSessionCache.CachedSession cachedSession = new InterviewSessionCache.CachedSession(
            "session-3",
            "resume-text",
            1L,
            JobRole.JAVA_BACKEND,
            "Java 后端",
            List.of(InterviewQuestionDTO.create(0, "介绍项目", InterviewQuestionDTO.QuestionType.PROJECT, "项目经历")),
            1,
            InterviewSessionDTO.SessionStatus.COMPLETED,
            objectMapper
        );

        when(sessionCache.getSession("session-3")).thenReturn(Optional.of(cachedSession));
        when(persistenceService.getEvaluateStatus("session-3")).thenReturn(Optional.of(AsyncTaskStatus.PROCESSING));

        assertThrows(BusinessException.class, () -> service.generateReport("session-3"));

        verify(persistenceService).getEvaluateStatus("session-3");
        verify(evaluationService, never()).evaluateInterview(any(), any(), any());
    }
}
