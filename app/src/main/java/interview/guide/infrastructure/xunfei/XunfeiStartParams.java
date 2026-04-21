package interview.guide.infrastructure.xunfei;

import lombok.Data;

/**
 * 讯飞虚拟人 Start 请求参数
 */
@Data
public class XunfeiStartParams {
    private String appId;
    private String sceneId;
    private String avatarId;
    private String vcn;
    private String protocol = "webrtc";  // webrtc/xrtc/rtmp/flv
    private int width = 720;
    private int height = 1280;
    private int fps = 25;
    private int bitrate = 5000;
    private int alpha = 0;  // 透明通道，仅 xrtc 协议有效
    private int speed = 50;
    private int pitch = 50;
    private int volume = 50;
    private String requestId = java.util.UUID.randomUUID().toString();
    /** 背景：type 可选 "url" 或 "res_key"，data 为对应值 */
    private String backgroundType;
    private String backgroundData;
}
