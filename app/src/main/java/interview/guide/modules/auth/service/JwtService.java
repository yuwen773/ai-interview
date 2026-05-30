package interview.guide.modules.auth.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import interview.guide.modules.auth.config.JwtConfig;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long validityMs;

    public JwtService(JwtConfig jwtConfig) {
        this.secretKey = Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
        this.validityMs = jwtConfig.getValiditySeconds() * 1000;
    }

    // 供测试用
    public JwtService(String secret, long validitySeconds) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.validityMs = validitySeconds * 1000;
    }

    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public TokenClaims parseToken(String token) {
        var parser = Jwts.parser()
                .verifyWith(secretKey)
                .build();

        var claims = parser.parseSignedClaims(token).getPayload();
        return new TokenClaims(
                Long.parseLong(claims.getSubject()),
                claims.get("email", String.class),
                claims.getExpiration()
        );
    }

    public record TokenClaims(Long userId, String email, Date expiration) {}
}