package interview.guide.modules.interview.service.impl;

import com.alibaba.fastjson2.JSONObject;
import interview.guide.infrastructure.xunfei.*;
import interview.guide.modules.interview.config.XunfeiAvatarProperties;
import interview.guide.modules.interview.service.XunfeiAvatarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.concurrent.*;

/**
 * 讯飞虚拟人服务实现
 * 支持多会话管理（每个面试会话独立的数字人连接）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class XunfeiAvatarServiceImpl implements XunfeiAvatarService {

    private final XunfeiAvatarProperties properties;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    // 多会话管理：interviewSessionId -> 会话上下文
    private final Map<String, SessionContext> sessions = new ConcurrentHashMap<>();

    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
        sessions.keySet().forEach(this::destroySession);
    }

    private static class SessionContext {
        XunfeiWebSocketClient client;
        ScheduledFuture<?> pingTask;
        CountDownLatch streamReadyLatch = new CountDownLatch(1);
        volatile String streamUrl;
        volatile String streamExtend;
        volatile boolean ready = false;

        void cleanup() {
            if (pingTask != null) pingTask.cancel(true);
            if (client != null) {
                try { client.close(); } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public XunfeiStreamInfo createSession(String interviewSessionId) {
        // 关闭旧会话（如有）
        destroySession(interviewSessionId);

        SessionContext ctx = new SessionContext();
        sessions.put(interviewSessionId, ctx);

        ctx.client = new XunfeiWebSocketClient();
        ctx.client.setHandler(new XunfeiWebSocketClient.XunfeiMessageHandler() {
            @Override
            public void onConnected(String sessionId, String streamUrl, JSONObject streamExtend) {
                ctx.streamUrl = streamUrl;
                ctx.streamExtend = streamExtend != null ? streamExtend.toJSONString() : null;
                ctx.ready = true;
                ctx.streamReadyLatch.countDown();
            }
            @Override public void onDriverStatus(String r, String s, int v) {}
            @Override public void onNlpResponse(String r, String a, String t) {}
            @Override
            public void onError(int code, String message) {
                log.error("[XunfeiAvatar] Error: code={}, message={}", code, message);
            }
            @Override
            public void onClosed(int code, String reason) {
                log.info("[XunfeiAvatar] Session closed: {}", reason);
                ctx.ready = false;
            }
        });

        // 构建鉴权 URL 并连接
        String authUrl = XunfeiAuthUtil.assembleRequestUrl(
            properties.getApiKey(),
            properties.getApiSecret()
        );
        log.info("[XunfeiAvatar] Connecting for session: {}", interviewSessionId);
        ctx.client.connect(authUrl);

        // 发送 Start 协议
        XunfeiStartParams params = new XunfeiStartParams();
        params.setAppId(properties.getAppId());
        params.setSceneId(properties.getSceneId());
        params.setAvatarId(properties.getAvatarId());
        params.setVcn(properties.getVcn());
        params.setProtocol(properties.getProtocol());
        params.setWidth(properties.getWidth());
        if ("xrtc".equals(properties.getProtocol())) {
            params.setAlpha(1);
        }
        params.setHeight(properties.getHeight());
        params.setSpeed(properties.getSpeed());
        params.setPitch(properties.getPitch());
        params.setVolume(properties.getVolume());

        try {
            ctx.client.sendStart(params);

            // 等待流信息（最多 10 秒）
            boolean ready = ctx.streamReadyLatch.await(10, TimeUnit.SECONDS);
            if (!ready || ctx.streamUrl == null) {
                throw new RuntimeException("Stream info timeout");
            }

            // 启动 Ping 心跳
            ctx.pingTask = scheduler.scheduleAtFixedRate(() -> {
                if (ctx.client != null && ctx.client.isConnected()) {
                    ctx.client.sendPing(properties.getAppId());
                }
            }, 5, 5, TimeUnit.SECONDS);

            log.info("[XunfeiAvatar] Session ready: {}", interviewSessionId);
            return new XunfeiStreamInfo(ctx.streamUrl, ctx.streamExtend, ctx.client.getStreamCid());

        } catch (Exception e) {
            destroySession(interviewSessionId);
            throw new RuntimeException("Failed to create session: " + e.getMessage(), e);
        }
    }

    @Override
    public void destroySession(String interviewSessionId) {
        SessionContext ctx = sessions.remove(interviewSessionId);
        if (ctx != null) {
            ctx.cleanup();
            log.info("[XunfeiAvatar] Session destroyed: {}", interviewSessionId);
        }
    }

    @Override
    public void sendQuestion(String interviewSessionId, String question) {
        SessionContext ctx = sessions.get(interviewSessionId);
        if (ctx == null || !ctx.ready) {
            throw new RuntimeException("Session not ready: " + interviewSessionId);
        }

        String requestId = java.util.UUID.randomUUID().toString();

        // 打断之前的播报
        ctx.client.sendReset(properties.getAppId(), java.util.UUID.randomUUID().toString());

        // 发送文本驱动
        ctx.client.sendTextDriver(
            properties.getAppId(),
            requestId,
            question,
            properties.getVcn(),
            properties.getSpeed(),
            properties.getPitch(),
            properties.getVolume()
        );
    }

    @Override
    public void stopSpeaking(String interviewSessionId) {
        SessionContext ctx = sessions.get(interviewSessionId);
        if (ctx != null && ctx.client != null && ctx.client.isConnected()) {
            ctx.client.sendReset(properties.getAppId(), java.util.UUID.randomUUID().toString());
        }
    }

    @Override
    public boolean isSessionReady(String interviewSessionId) {
        SessionContext ctx = sessions.get(interviewSessionId);
        return ctx != null && ctx.ready;
    }
}
