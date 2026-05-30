package interview.guide.modules.auth.model;
public record AuthResponse(String token, Long userId, String nickname) {}