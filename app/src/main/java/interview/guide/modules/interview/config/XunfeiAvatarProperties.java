package interview.guide.modules.interview.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "xunfei.avatar")
public class XunfeiAvatarProperties {

    /** 是否启用讯飞虚拟人 */
    private boolean enabled = false;

    /** API Key */
    private String apiKey;

    /** API Secret */
    private String apiSecret;

    /** App ID */
    private String appId;

    /** Scene ID（接口服务 ID） */
    private String sceneId;

    /** 数字人形象 ID */
    private String avatarId;

    /** 发音人声音 ID */
    private String vcn;

    /** 视频协议：webrtc/xrtc/rtmp/flv */
    private String protocol = "webrtc";

    /** 视频宽度 */
    private int width = 720;

    /** 视频高度 */
    private int height = 1280;

    /** 语速 [0-100] */
    private int speed = 50;

    /** 语调 [0-100] */
    private int pitch = 50;

    /** 音量 [0-100] */
    private int volume = 50;

    /** 背景类型：url 或 res_key */
    private String backgroundType;

    /** 背景数据：图片地址或 res_key 值 */
    private String backgroundData;
}
