package interview.guide.modules.profile.listener;

import interview.guide.common.async.AbstractStreamProducer;
import interview.guide.common.constant.AsyncTaskStreamConstants;
import interview.guide.infrastructure.redis.RedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 画像更新任务生产者
 * 负责发送画像更新任务到 Redis Stream
 */
@Slf4j
@Component
public class ProfileUpdateStreamProducer extends AbstractStreamProducer<ProfileUpdateStreamProducer.ProfileUpdatePayload> {

    public ProfileUpdateStreamProducer(RedisService redisService) {
        super(redisService);
    }

    public record ProfileUpdatePayload(String sessionId, String userId) {}

    public void sendProfileUpdateTask(String sessionId, String userId) {
        sendTask(new ProfileUpdatePayload(sessionId, userId));
    }

    @Override
    protected String taskDisplayName() {
        return "画像更新";
    }

    @Override
    protected String streamKey() {
        return AsyncTaskStreamConstants.PROFILE_UPDATE_STREAM_KEY;
    }

    @Override
    protected Map<String, String> buildMessage(ProfileUpdatePayload payload) {
        return Map.of(
            AsyncTaskStreamConstants.FIELD_SESSION_ID, payload.sessionId(),
            AsyncTaskStreamConstants.FIELD_USER_ID, payload.userId(),
            AsyncTaskStreamConstants.FIELD_RETRY_COUNT, "0"
        );
    }

    @Override
    protected String payloadIdentifier(ProfileUpdatePayload payload) {
        return "sessionId=" + payload.sessionId() + ", userId=" + payload.userId();
    }

    @Override
    protected void onSendFailed(ProfileUpdatePayload payload, String error) {
        log.error("画像更新任务入队失败: sessionId={}, error={}", payload.sessionId(), error);
    }
}
