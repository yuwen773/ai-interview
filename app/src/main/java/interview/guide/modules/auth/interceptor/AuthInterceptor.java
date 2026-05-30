package interview.guide.modules.auth.interceptor;

import interview.guide.modules.auth.service.JwtService;
import jakarta.servlet.http.*;
import jakarta.servlet.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;

    public AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        // 放行 /auth/* 和 /health
        if (path.startsWith("/auth/") || path.equals("/health")) {
            return true;
        }

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
            return false;
        }

        String token = auth.substring(7);
        try {
            JwtService.TokenClaims claims = jwtService.parseToken(token);
            request.setAttribute("userId", claims.userId());
            request.setAttribute("email", claims.email());
            return true;
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":401,\"message\":\"Token无效或已过期\"}");
            return false;
        }
    }
}