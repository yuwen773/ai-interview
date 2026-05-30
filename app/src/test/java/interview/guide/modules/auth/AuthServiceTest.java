package interview.guide.modules.auth;

import interview.guide.modules.auth.model.*;
import interview.guide.modules.auth.entity.UserEntity;
import interview.guide.modules.auth.repository.UserRepository;
import interview.guide.modules.auth.service.AuthService;
import interview.guide.modules.auth.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AuthServiceTest {

    private AuthService authService;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        JwtService jwtService = new JwtService("test-secret-key-that-is-long-enough-for-hs256", 86400);
        authService = new AuthService(userRepository, jwtService);
    }

    @Test
    void registerSuccess() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> {
            UserEntity u = i.getArgument(0);
            u.setId(1L);
            return u;
        });

        RegisterRequest req = new RegisterRequest("new@example.com", "SecurePass123", "Nickname");
        AuthResponse resp = authService.register(req);

        assertNotNull(resp.token());
        assertEquals(1L, resp.userId());
        assertEquals("Nickname", resp.nickname());
    }

    @Test
    void registerDuplicateEmailThrows() {
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        RegisterRequest req = new RegisterRequest("existing@example.com", "SecurePass123", "Nickname");
        assertThrows(IllegalArgumentException.class, () -> authService.register(req));
    }

    @Test
    void loginSuccess() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("CorrectPass123");
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setPasswordHash(hash);
        user.setNickname("User");

        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));

        LoginRequest req = new LoginRequest("user@example.com", "CorrectPass123");
        AuthResponse resp = authService.login(req);

        assertNotNull(resp.token());
        assertEquals(1L, resp.userId());
    }

    @Test
    void loginWrongPasswordThrows() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("CorrectPass123");
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setPasswordHash(hash);

        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));

        LoginRequest req = new LoginRequest("user@example.com", "WrongPass123");
        assertThrows(IllegalArgumentException.class, () -> authService.login(req));
    }
}