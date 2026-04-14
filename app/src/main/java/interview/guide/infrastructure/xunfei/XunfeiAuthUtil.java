package interview.guide.infrastructure.xunfei;

import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 讯飞虚拟人 WebSocket 鉴权工具类
 */
public class XunfeiAuthUtil {

    private static final String HOST = "avatar.cn-huadong-1.xf-yun.com";
    private static final String WEBSOCKET_URL = "wss://" + HOST + "/v1/interact";

    /**
     * 构建鉴权后的 WebSocket URL
     *
     * @param apiKey    API Key
     * @param apiSecret API Secret
     * @return 鉴权后的完整 URL
     */
    public static String assembleRequestUrl(String apiKey, String apiSecret) {
        return assembleRequestUrl(WEBSOCKET_URL, apiKey, apiSecret, "GET");
    }

    public static String assembleRequestUrl(String requestUrl, String apiKey, String apiSecret, String method) {
        // 转换 WebSocket URL 为 HTTP URL
        String httpRequestUrl = requestUrl.replace("ws://", "http://").replace("wss://", "https://");

        try {
            URL url = new URL(httpRequestUrl);

            // UTC 时间格式
            SimpleDateFormat format = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
            format.setTimeZone(TimeZone.getTimeZone("UTC"));
            String date = format.format(new Date());
            String host = url.getHost();

            // 签名字符串
            StringBuilder builder = new StringBuilder();
            builder.append("host: ").append(host).append("\n");
            builder.append("date: ").append(date).append("\n");
            builder.append(method).append(" ").append(url.getPath()).append(" HTTP/1.1");

            // HMAC SHA-256 签名
            Mac mac = Mac.getInstance("hmacsha256");
            SecretKeySpec spec = new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "hmacsha256");
            mac.init(spec);
            byte[] hexDigits = mac.doFinal(builder.toString().getBytes(StandardCharsets.UTF_8));
            String signature = Base64.getEncoder().encodeToString(hexDigits);

            // 构造 Authorization 头
            String authorization = String.format(
                "hmac username=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"",
                apiKey, "hmac-sha256", "host date request-line", signature
            );
            String authBase = Base64.getEncoder().encodeToString(authorization.getBytes(StandardCharsets.UTF_8));

            // 返回带鉴权参数的 URL
            return String.format(
                "%s?authorization=%s&host=%s&date=%s",
                requestUrl,
                URLEncoder.encode(authBase, StandardCharsets.UTF_8),
                URLEncoder.encode(host, StandardCharsets.UTF_8),
                URLEncoder.encode(date, StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to assemble request URL: " + e.getMessage(), e);
        }
    }
}
