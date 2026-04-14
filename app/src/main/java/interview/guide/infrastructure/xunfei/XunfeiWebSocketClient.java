package interview.guide.infrastructure.xunfei;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;

import java.util.Objects;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 讯飞虚拟人 WebSocket 客户端
 *
 * 关键改进（相比 Demo）：
 * - 移除 System.exit(0)，改用错误回调
 * - 实例级别状态，支持多会话
 * - 添加 isConnected() 方法
 */
@Slf4j
public class XunfeiWebSocketClient {

    private static final AtomicBoolean isConnected = new AtomicBoolean(false);

    private WebSocket webSocket;
    private CountDownLatch connectLatch;
    private String sessionId;
    private String streamUrl;
    private JSONObject streamExtend;

    // 回调接口
    private XunfeiMessageHandler handler;

    public interface XunfeiMessageHandler {
        void onConnected(String sessionId, String streamUrl, JSONObject streamExtend);
        void onDriverStatus(String requestId, String status, int vmrStatus);
        void onNlpResponse(String requestId, String answer, String ttsText);
        void onError(int code, String message);
        void onClosed(int code, String reason);
    }

    public void setHandler(XunfeiMessageHandler handler) {
        this.handler = handler;
    }

    /**
     * 连接讯飞 WebSocket
     */
    public void connect(String requestUrl) {
        Request request = new Request.Builder().url(requestUrl).build();
        OkHttpClient client = new OkHttpClient.Builder().build();

        connectLatch = new CountDownLatch(1);
        this.webSocket = client.newWebSocket(request, buildListener());
    }

    /**
     * 发送 Start 协议（建立会话）
     */
    public void sendStart(XunfeiStartParams params) throws Exception {
        connectLatch.await();

        JSONObject header = new JSONObject()
            .fluentPut("app_id", params.getAppId())
            .fluentPut("ctrl", "start")
            .fluentPut("request_id", params.getRequestId())
            .fluentPut("scene_id", params.getSceneId());

        JSONObject stream = new JSONObject()
            .fluentPut("protocol", params.getProtocol())
            .fluentPut("fps", params.getFps())
            .fluentPut("bitrate", params.getBitrate());

        if (params.getProtocol().equals("xrtc")) {
            stream.put("alpha", params.getAlpha());
        }

        JSONObject avatar = new JSONObject()
            .fluentPut("avatar_id", params.getAvatarId())
            .fluentPut("width", params.getWidth())
            .fluentPut("height", params.getHeight())
            .fluentPut("stream", stream);

        JSONObject parameter = new JSONObject()
            .fluentPut("avatar", avatar);

        if (params.getVcn() != null) {
            parameter.put("tts", new JSONObject()
                .fluentPut("vcn", params.getVcn())
                .fluentPut("speed", params.getSpeed())
                .fluentPut("pitch", params.getPitch())
                .fluentPut("volume", params.getVolume()));
        }

        JSONObject request = new JSONObject()
            .fluentPut("header", header)
            .fluentPut("parameter", parameter);

        send(request);
        log.info("[XunfeiWebSocket] Start request sent: {}", request.toJSONString());
    }

    /**
     * 发送文本驱动（纯播报，不走语义理解）
     */
    public void sendTextDriver(String appId, String requestId, String text) {
        sendTextDriver(appId, requestId, text, null, 0, 0, 0);
    }

    /**
     * 发送文本驱动（带 TTS 参数）
     */
    public void sendTextDriver(String appId, String requestId, String text,
                               String vcn, int speed, int pitch, int volume) {
        JSONObject header = new JSONObject()
            .fluentPut("app_id", appId)
            .fluentPut("ctrl", "text_driver")
            .fluentPut("request_id", requestId);

        JSONObject avatarDispatch = new JSONObject()
            .fluentPut("interactive_mode", 0);  // 0追加 1打断

        JSONObject parameter = new JSONObject()
            .fluentPut("avatar_dispatch", avatarDispatch);

        if (vcn != null) {
            parameter.put("tts", new JSONObject()
                .fluentPut("vcn", vcn)
                .fluentPut("speed", speed)
                .fluentPut("pitch", pitch)
                .fluentPut("volume", volume));
        }

        JSONObject payload = new JSONObject()
            .fluentPut("text", new JSONObject()
                .fluentPut("content", text));

        JSONObject request = new JSONObject()
            .fluentPut("header", header)
            .fluentPut("parameter", parameter)
            .fluentPut("payload", payload);

        send(request);
        log.info("[XunfeiWebSocket] Text driver sent: {}", text);
    }

    /**
     * 发送打断协议
     */
    public void sendReset(String appId, String requestId) {
        JSONObject header = new JSONObject()
            .fluentPut("app_id", appId)
            .fluentPut("ctrl", "reset")
            .fluentPut("request_id", requestId);

        JSONObject request = new JSONObject()
            .fluentPut("header", header);

        send(request);
        log.info("[XunfeiWebSocket] Reset sent");
    }

    /**
     * 发送停止协议
     */
    public void sendStop(String appId, String requestId) {
        JSONObject header = new JSONObject()
            .fluentPut("app_id", appId)
            .fluentPut("ctrl", "stop")
            .fluentPut("request_id", requestId);

        JSONObject request = new JSONObject()
            .fluentPut("header", header);

        send(request);
        log.info("[XunfeiWebSocket] Stop sent");
    }

    /**
     * 发送 Ping 心跳（每 5 秒一次）
     */
    public void sendPing(String appId) {
        JSONObject header = new JSONObject()
            .fluentPut("app_id", appId)
            .fluentPut("ctrl", "ping")
            .fluentPut("request_id", java.util.UUID.randomUUID().toString());

        JSONObject request = new JSONObject()
            .fluentPut("header", header);

        send(request);
    }

    /**
     * 关闭连接
     */
    public void close() {
        if (webSocket != null) {
            webSocket.close(1000, "Normal closure");
        }
    }

    private void send(JSONObject request) {
        if (isConnected.get() && webSocket != null) {
            webSocket.send(request.toJSONString());
        }
    }

    private WebSocketListener buildListener() {
        return new WebSocketListener() {
            @Override
            public void onOpen(@NotNull WebSocket webSocket, @NotNull Response response) {
                log.info("[XunfeiWebSocket] Connected");
                isConnected.set(true);
                connectLatch.countDown();
            }

            @Override
            public void onMessage(@NotNull WebSocket webSocket, @NotNull String text) {
                log.info("[XunfeiWebSocket] Received: {}", text);
                handleMessage(text);
            }

            @Override
            public void onClosing(@NotNull WebSocket webSocket, int code, @NotNull String reason) {
                log.info("[XunfeiWebSocket] Closing: code={}, reason={}", code, reason);
                webSocket.close(code, reason);
            }

            @Override
            public void onClosed(@NotNull WebSocket webSocket, int code, @NotNull String reason) {
                log.info("[XunfeiWebSocket] Closed: code={}, reason={}", code, reason);
                isConnected.set(false);
                if (handler != null) {
                    handler.onClosed(code, reason);
                }
            }

            @Override
            public void onFailure(@NotNull WebSocket webSocket, @NotNull Throwable t, Response response) {
                log.error("[XunfeiWebSocket] Error: {}", t.getMessage(), t);
                isConnected.set(false);
                if (handler != null) {
                    handler.onError(-1, t.getMessage());
                }
            }
        };
    }

    private void handleMessage(String text) {
        try {
            JSONObject json = JSON.parseObject(text);
            JSONObject header = json.getJSONObject("header");
            int code = header.getIntValue("code");

            if (code != 0) {
                log.error("[XunfeiWebSocket] Error response: code={}, message={}",
                    code, header.getString("message"));
                if (handler != null) {
                    handler.onError(code, header.getString("message"));
                }
                return;
            }

            String sid = header.getString("sid");
            if (sid != null && this.sessionId == null) {
                this.sessionId = sid;
            }

            JSONObject payload = json.getJSONObject("payload");
            if (payload == null) return;

            // 处理 stream_info（Start 响应）
            JSONObject avatar = payload.getJSONObject("avatar");
            if (avatar != null) {
                String eventType = avatar.getString("event_type");

                if ("stream_info".equals(eventType)) {
                    this.streamUrl = avatar.getString("stream_url");
                    this.streamExtend = avatar.getJSONObject("stream_extend");
                    log.info("[XunfeiWebSocket] Stream info received: url={}", streamUrl);
                    if (handler != null) {
                        handler.onConnected(sessionId, streamUrl, streamExtend);
                    }
                } else if ("driver_status".equals(eventType)) {
                    String requestId = avatar.getString("request_id");
                    String period = avatar.getString("period");
                    int vmrStatus = avatar.getIntValue("vmr_status");
                    if (handler != null) {
                        handler.onDriverStatus(requestId, period, vmrStatus);
                    }
                }
            }

            // 处理 NLP 响应（text_interact）
            JSONObject nlp = payload.getJSONObject("nlp");
            if (nlp != null && handler != null) {
                String requestId = nlp.getString("request_id");
                JSONObject answer = nlp.getJSONObject("answer");
                if (answer != null) {
                    String answerText = answer.getString("text");
                    String ttsText = nlp.getJSONObject("tts_answer") != null
                        ? nlp.getJSONObject("tts_answer").getString("text")
                        : null;
                    handler.onNlpResponse(requestId, answerText, ttsText);
                }
            }

        } catch (Exception e) {
            log.error("[XunfeiWebSocket] Parse error: {}", e.getMessage(), e);
        }
    }

    // Getter
    public String getSessionId() { return sessionId; }
    public String getStreamUrl() { return streamUrl; }
    public JSONObject getStreamExtend() { return streamExtend; }
    public boolean isConnected() { return isConnected.get(); }
}
