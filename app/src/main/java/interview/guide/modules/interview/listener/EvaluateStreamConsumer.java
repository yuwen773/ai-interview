package interview.guide.modules.interview.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import interview.guide.common.async.AbstractStreamConsumer;
import interview.guide.common.constant.AsyncTaskStreamConstants;
import interview.guide.common.model.AsyncTaskStatus;
import interview.guide.infrastructure.redis.InterviewSessionCache;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.InterviewReportDTO;
import interview.guide.modules.interview.model.InterviewSessionEntity;
import interview.guide.modules.interview.model.InterviewSessionDTO.SessionStatus;
import interview.guide.modules.interview.repository.InterviewSessionRepository;
import interview.guide.modules.interview.service.AnswerEvaluationService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.profile.listener.ProfileUpdateStreamProducer;
import interview.guide.modules.profile.model.dto.EvaluationMatch;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.stream.StreamMessageId;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 面试评估 Stream 消费者
 * 负责从 Redis Stream 消费消息并执行评估
 */
@Slf4j
@Component
public class EvaluateStreamConsumer extends AbstractStreamConsumer<EvaluateStreamConsumer.EvaluatePayload> {

    private final InterviewSessionRepository sessionRepository;
    private final AnswerEvaluationService evaluationService;
    private final InterviewPersistenceService persistenceService;
    private final InterviewSessionCache sessionCache;
    private final ObjectMapper objectMapper;
    private final ProfileUpdateStreamProducer profileUpdateProducer;
    private final UserProfileService userProfileService;

    /** Default user identifier for MVP (no auth module yet) */
    private static final String DEFAULT_USER_ID = "default";

    public EvaluateStreamConsumer(
        RedisService redisService,
        InterviewSessionRepository sessionRepository,
        AnswerEvaluationService evaluationService,
        InterviewPersistenceService persistenceService,
        InterviewSessionCache sessionCache,
        ObjectMapper objectMapper,
        ProfileUpdateStreamProducer profileUpdateProducer,
        UserProfileService userProfileService
    ) {
        super(redisService);
        this.sessionRepository = sessionRepository;
        this.evaluationService = evaluationService;
        this.persistenceService = persistenceService;
        this.sessionCache = sessionCache;
        this.objectMapper = objectMapper;
        this.profileUpdateProducer = profileUpdateProducer;
        this.userProfileService = userProfileService;
    }

    record EvaluatePayload(String sessionId) {}

    @Override
    protected String taskDisplayName() {
        return "评估";
    }

    @Override
    protected String streamKey() {
        return AsyncTaskStreamConstants.INTERVIEW_EVALUATE_STREAM_KEY;
    }

    @Override
    protected String groupName() {
        return AsyncTaskStreamConstants.INTERVIEW_EVALUATE_GROUP_NAME;
    }

    @Override
    protected String consumerPrefix() {
        return AsyncTaskStreamConstants.INTERVIEW_EVALUATE_CONSUMER_PREFIX;
    }

    @Override
    protected String threadName() {
        return "evaluate-consumer";
    }

    @Override
    protected EvaluatePayload parsePayload(StreamMessageId messageId, Map<String, String> data) {
        String sessionId = data.get(AsyncTaskStreamConstants.FIELD_SESSION_ID);
        if (sessionId == null) {
            log.warn("消息格式错误，跳过: messageId={}", messageId);
            return null;
        }
        return new EvaluatePayload(sessionId);
    }

    @Override
    protected String payloadIdentifier(EvaluatePayload payload) {
        return "sessionId=" + payload.sessionId();
    }

    @Override
    protected void markProcessing(EvaluatePayload payload) {
        updateEvaluateStatus(payload.sessionId(), AsyncTaskStatus.PROCESSING, null);
    }

    @Override
    protected void processBusiness(EvaluatePayload payload) {
        String sessionId = payload.sessionId();
        Optional<InterviewSessionEntity> sessionOpt = sessionRepository.findBySessionIdWithResume(sessionId);
        if (sessionOpt.isEmpty()) {
            log.warn("会话已被删除，跳过评估任务: sessionId={}", sessionId);
            return;
        }

        InterviewSessionEntity session = sessionOpt.get();
        List<InterviewQuestionDTO> questions = null;
        try {
            questions = objectMapper.readValue(
                session.getQuestionsJson(),
                new TypeReference<>() {}
            );
        } catch (JsonProcessingException e) {
            log.error("会话问题解析失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
        }

        List<interview.guide.modules.interview.model.InterviewAnswerEntity> answers =
            persistenceService.findAnswersBySessionId(sessionId);
        for (interview.guide.modules.interview.model.InterviewAnswerEntity answer : answers) {
            int index = answer.getQuestionIndex();
            if (index >= 0 && index < questions.size()) {
                InterviewQuestionDTO question = questions.get(index);
                questions.set(index, question.withAnswer(answer.getUserAnswer()));
            }
        }

        String resumeText = session.getResume().getResumeText();
        InterviewReportDTO report = evaluationService.evaluateInterview(sessionId, resumeText, questions);
        persistenceService.saveReport(sessionId, report);
        sessionCache.updateSessionStatus(sessionId, SessionStatus.EVALUATED);

        // Trigger Mem0-style profile update after evaluation
        try {
            profileUpdateProducer.sendProfileUpdateTask(sessionId, DEFAULT_USER_ID);
        } catch (Exception e) {
            log.warn("触发画像更新失败(不影响评估结果): sessionId={}, error={}", sessionId, e.getMessage());
        }

        // Auto SR update: match evaluated questions to existing weak points and update SR state
        try {
            List<EvaluationMatch> evalMatches = report.questionDetails().stream()
                .filter(qd -> qd.question() != null && !qd.question().isBlank())
                .map(qd -> new EvaluationMatch(
                    qd.question(),
                    qd.category() != null ? qd.category() : "",
                    qd.score() / 10.0  // convert 0-100 to 0-10
                ))
                .toList();
            int updated = userProfileService.autoUpdateSrFromEvaluation(DEFAULT_USER_ID, evalMatches);
            if (updated > 0) {
                log.info("Auto SR update: {} weak points matched and updated for session: {}", updated, sessionId);
            }
        } catch (Exception e) {
            log.warn("自动SR更新失败(不影响评估结果): sessionId={}, error={}", sessionId, e.getMessage());
        }
    }

    @Override
    protected void markCompleted(EvaluatePayload payload) {
        updateEvaluateStatus(payload.sessionId(), AsyncTaskStatus.COMPLETED, null);
    }

    @Override
    protected void markFailed(EvaluatePayload payload, String error) {
        updateEvaluateStatus(payload.sessionId(), AsyncTaskStatus.FAILED, error);
    }

    @Override
    protected void retryMessage(EvaluatePayload payload, int retryCount) {
        String sessionId = payload.sessionId();
        try {
            Map<String, String> message = Map.of(
                AsyncTaskStreamConstants.FIELD_SESSION_ID, sessionId,
                AsyncTaskStreamConstants.FIELD_RETRY_COUNT, String.valueOf(retryCount)
            );

            redisService().streamAdd(
                AsyncTaskStreamConstants.INTERVIEW_EVALUATE_STREAM_KEY,
                message,
                AsyncTaskStreamConstants.STREAM_MAX_LEN
            );
            log.info("评估任务已重新入队: sessionId={}, retryCount={}", sessionId, retryCount);

        } catch (Exception e) {
            log.error("重试入队失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
            updateEvaluateStatus(sessionId, AsyncTaskStatus.FAILED, truncateError("重试入队失败: " + e.getMessage()));
        }
    }

    /**
     * 更新评估状态
     */
    private void updateEvaluateStatus(String sessionId, AsyncTaskStatus status, String error) {
        try {
            sessionRepository.findBySessionId(sessionId).ifPresent(session -> {
                session.setEvaluateStatus(status);
                session.setEvaluateError(error);
                sessionRepository.save(session);
                log.debug("评估状态已更新: sessionId={}, status={}", sessionId, status);
            });
        } catch (Exception e) {
            log.error("更新评估状态失败: sessionId={}, status={}, error={}", sessionId, status, e.getMessage(), e);
        }
    }

}
