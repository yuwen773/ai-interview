package interview.guide.modules.auth;

import interview.guide.modules.auth.service.JwtService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService("test-secret-key-that-is-long-enough-for-hs256", 86400L);

    @Test
    void generateAndParseToken() {
        String token = jwtService.generateToken(1L, "user@example.com");
        assertNotNull(token);

        var claims = jwtService.parseToken(token);
        assertEquals(1L, claims.userId());
        assertEquals("user@example.com", claims.email());
    }

    @Test
    void parseInvalidTokenThrows() {
        assertThrows(Exception.class, () -> jwtService.parseToken("invalid.token.here"));
    }

    @Test
    void expiredTokenThrows() {
        // Use a service with 0 validity to test expiration
        JwtService shortLivedService = new JwtService("test-secret-key-that-is-long-enough-for-hs256", -1L);
        String token = shortLivedService.generateToken(1L, "user@example.com");
        assertThrows(Exception.class, () -> shortLivedService.parseToken(token));
    }
}