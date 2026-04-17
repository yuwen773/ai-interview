package interview.guide.modules.voiceinterview.listener;

import interview.guide.infrastructure.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 语音面试评估 Stream 生产者
 * 负责将评估任务发送到 Redis Stream
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class VoiceEvaluateStreamProducer {

    private final RedisService redisService;
    private static final String STREAM_KEY = "voice:interview:evaluate:stream";

    public void sendEvaluateTask(String sessionId) {
        try {
            Map<String, String> fields = Map.of("sessionId", sessionId);
            String messageId = redisService.streamAdd(STREAM_KEY, fields);
            log.info("Sent evaluation task to stream: sessionId={}, messageId={}", sessionId, messageId);
        } catch (Exception e) {
            log.error("Failed to send evaluation task: sessionId={}", sessionId, e);
        }
    }
}