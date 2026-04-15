package interview.guide.modules.profile.listener;

import interview.guide.common.async.AbstractStreamConsumer;
import interview.guide.common.constant.AsyncTaskStreamConstants;
import interview.guide.infrastructure.redis.RedisService;
import interview.guide.modules.profile.service.ProfileMemoryService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.stream.StreamMessageId;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 画像更新 Stream 消费者
 * 负责从 Redis Stream 消费消息并执行 Mem0 式画像更新
 */
@Slf4j
@Component
public class ProfileUpdateStreamConsumer extends AbstractStreamConsumer<ProfileUpdateStreamConsumer.ProfileUpdatePayload> {

    private final ProfileMemoryService memoryService;

    public ProfileUpdateStreamConsumer(RedisService redisService, ProfileMemoryService memoryService) {
        super(redisService);
        this.memoryService = memoryService;
    }

    record ProfileUpdatePayload(String sessionId, String userId) {}

    @Override
    protected String taskDisplayName() {
        return "画像更新";
    }

    @Override
    protected String streamKey() {
        return AsyncTaskStreamConstants.PROFILE_UPDATE_STREAM_KEY;
    }

    @Override
    protected String groupName() {
        return AsyncTaskStreamConstants.PROFILE_UPDATE_GROUP_NAME;
    }

    @Override
    protected String consumerPrefix() {
        return AsyncTaskStreamConstants.PROFILE_UPDATE_CONSUMER_PREFIX;
    }

    @Override
    protected String threadName() {
        return "profile-update-consumer";
    }

    @Override
    protected ProfileUpdatePayload parsePayload(StreamMessageId messageId, Map<String, String> data) {
        String sessionId = data.get(AsyncTaskStreamConstants.FIELD_SESSION_ID);
        String userId = data.get(AsyncTaskStreamConstants.FIELD_USER_ID);
        if (sessionId == null || userId == null) {
            log.warn("消息格式错误，跳过: messageId={}", messageId);
            return null;
        }
        return new ProfileUpdatePayload(sessionId, userId);
    }

    @Override
    protected String payloadIdentifier(ProfileUpdatePayload payload) {
        return "sessionId=" + payload.sessionId() + ", userId=" + payload.userId();
    }

    @Override
    protected void markProcessing(ProfileUpdatePayload payload) {
        log.info("开始画像更新: sessionId={}, userId={}", payload.sessionId(), payload.userId());
    }

    @Override
    protected void processBusiness(ProfileUpdatePayload payload) {
        memoryService.extractAndUpdate(payload.sessionId(), payload.userId());
    }

    @Override
    protected void markCompleted(ProfileUpdatePayload payload) {
        log.info("画像更新完成: sessionId={}", payload.sessionId());
    }

    @Override
    protected void markFailed(ProfileUpdatePayload payload, String error) {
        log.error("画像更新失败: sessionId={}, error={}", payload.sessionId(), error);
    }

    @Override
    protected void retryMessage(ProfileUpdatePayload payload, int retryCount) {
        try {
            redisService().streamAdd(
                streamKey(),
                Map.of(
                    AsyncTaskStreamConstants.FIELD_SESSION_ID, payload.sessionId(),
                    AsyncTaskStreamConstants.FIELD_USER_ID, payload.userId(),
                    AsyncTaskStreamConstants.FIELD_RETRY_COUNT, String.valueOf(retryCount)
                ),
                AsyncTaskStreamConstants.STREAM_MAX_LEN
            );
            log.info("画像更新任务已重新入队: sessionId={}, retryCount={}", payload.sessionId(), retryCount);
        } catch (Exception e) {
            log.error("画像更新重试入队失败: sessionId={}, error={}", payload.sessionId(), e.getMessage(), e);
        }
    }
}
