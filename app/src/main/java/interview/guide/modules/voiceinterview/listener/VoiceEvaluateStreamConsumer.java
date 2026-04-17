package interview.guide.modules.voiceinterview.listener;

import interview.guide.common.async.AbstractStreamConsumer;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.voiceinterview.service.VoiceInterviewEvaluationService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.stream.StreamMessageId;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 语音面试评估 Stream 消费者
 * 负责从 Redis Stream 消费消息并执行评估
 */
@Slf4j
@Component
public class VoiceEvaluateStreamConsumer extends AbstractStreamConsumer<VoiceEvaluateStreamConsumer.EvaluatePayload> {

    private static final String STREAM_KEY = "voice:interview:evaluate:stream";
    private static final String GROUP_NAME = "voice-evaluator-group";
    private static final String CONSUMER_PREFIX = "voice-evaluator-";

    private final VoiceInterviewEvaluationService evaluationService;

    public VoiceEvaluateStreamConsumer(
            RedisService redisService,
            VoiceInterviewEvaluationService evaluationService) {
        super(redisService);
        this.evaluationService = evaluationService;
    }

    record EvaluatePayload(String sessionId) {}

    @Override
    protected String taskDisplayName() {
        return "语音面试评估";
    }

    @Override
    protected String streamKey() {
        return STREAM_KEY;
    }

    @Override
    protected String groupName() {
        return GROUP_NAME;
    }

    @Override
    protected String consumerPrefix() {
        return CONSUMER_PREFIX;
    }

    @Override
    protected String threadName() {
        return "voice-evaluate-consumer";
    }

    @Override
    protected EvaluatePayload parsePayload(StreamMessageId messageId, Map<String, String> data) {
        String sessionId = data.get("sessionId");
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
        log.info("开始处理语音面试评估任务: sessionId={}", payload.sessionId());
    }

    @Override
    protected void processBusiness(EvaluatePayload payload) {
        try {
            evaluationService.generateEvaluation(Long.parseLong(payload.sessionId()));
        } catch (Exception e) {
            log.error("评估处理失败: sessionId={}, error={}", payload.sessionId(), e.getMessage(), e);
            throw e;
        }
    }

    @Override
    protected void markCompleted(EvaluatePayload payload) {
        log.info("语音面试评估任务完成: sessionId={}", payload.sessionId());
    }

    @Override
    protected void markFailed(EvaluatePayload payload, String error) {
        log.error("语音面试评估任务失败: sessionId={}, error={}", payload.sessionId(), error);
    }

    @Override
    protected void retryMessage(EvaluatePayload payload, int retryCount) {
        log.warn("语音面试评估任务重试: sessionId={}, retryCount={}", payload.sessionId(), retryCount);
    }
}