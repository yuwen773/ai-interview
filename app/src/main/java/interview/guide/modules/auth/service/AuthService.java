package interview.guide.modules.auth.service;

import interview.guide.modules.auth.entity.UserEntity;
import interview.guide.modules.auth.model.*;
import interview.guide.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("邮箱已被注册");
        }
        if (req.password().length() < 8) {
            throw new IllegalArgumentException("密码长度至少8位");
        }

        UserEntity user = new UserEntity();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setNickname(req.nickname());

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getNickname());
    }

    public AuthResponse login(LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("用户不存在或密码错误"));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("用户不存在或密码错误");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getNickname());
    }
}