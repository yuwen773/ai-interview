package interview.guide.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "auth.jwt")
public class JwtConfig {
    private String secret = "default-secret-key-change-in-production-must-be-at-least-256-bits";
    private long validitySeconds = 604800; // 7 days

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getValiditySeconds() { return validitySeconds; }
    public void setValiditySeconds(long validitySeconds) { this.validitySeconds = validitySeconds; }
}