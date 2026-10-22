package interview.guide.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * RustFS (S3兼容) 存储配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageConfigProperties {

    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String bucket;
    private String region = "us-east-1";

    /**
     * 浏览器侧访问前缀（同源相对路径），与 endpoint 分开配置。
     * endpoint 是后端 S3 SDK 的连接地址，通常只监听 127.0.0.1。
     */
    private String publicBaseUrl = "/s3";
}
