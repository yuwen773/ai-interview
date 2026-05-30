package interview.guide.modules.auth;

import interview.guide.modules.auth.interceptor.AuthInterceptor;
import interview.guide.modules.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.junit.jupiter.api.Assertions.*;

class AuthInterceptorTest {

    private AuthInterceptor interceptor;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("test-secret-key-that-is-long-enough-for-hs256", 86400);
        interceptor = new AuthInterceptor(jwtService);
    }

    @Test
    void validTokenPasses() throws Exception {
        String token = jwtService.generateToken(1L, "user@example.com");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);

        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean result = interceptor.preHandle(request, response, null);

        assertTrue(result);
        assertEquals(1L, request.getAttribute("userId"));
        assertEquals("user@example.com", request.getAttribute("email"));
    }

    @Test
    void missingTokenReturns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean result = interceptor.preHandle(request, response, null);

        assertFalse(result);
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
    }

    @Test
    void invalidTokenReturns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid.token.here");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean result = interceptor.preHandle(request, response, null);

        assertFalse(result);
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
    }
}