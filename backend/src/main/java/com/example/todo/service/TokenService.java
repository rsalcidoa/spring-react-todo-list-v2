package com.example.todo.service;

import com.example.todo.dto.TokenPairResponse;
import com.example.todo.exception.InvalidRefreshTokenException;
import com.example.todo.model.RefreshToken;
import com.example.todo.model.User;
import com.example.todo.repository.RefreshTokenRepository;
import com.example.todo.repository.UserRepository;
import com.example.todo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/** Issues access/refresh token pairs and rotates refresh tokens with reuse detection. */
@Service
public class TokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final Clock clock;
    private final long refreshExpirationMs;
    private final SecureRandom random = new SecureRandom();

    public TokenService(RefreshTokenRepository refreshTokenRepository,
                        UserRepository userRepository,
                        JwtUtil jwtUtil,
                        Clock clock,
                        @Value("${todo.security.jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.clock = clock;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public TokenPairResponse issueForEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(InvalidRefreshTokenException::new);
        return issue(user);
    }

    public TokenPairResponse issue(User user) {
        String access = jwtUtil.generateToken(user.getEmail());
        String raw = randomToken();
        LocalDateTime expiresAt = LocalDateTime.now(clock).plusSeconds(refreshExpirationMs / 1000);
        refreshTokenRepository.save(new RefreshToken(sha256(raw), user, expiresAt));
        return new TokenPairResponse(access, raw);
    }

    public TokenPairResponse refresh(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);
        LocalDateTime now = LocalDateTime.now(clock);
        if (token.getRevokedAt() != null) {
            // Reuse of a rotated token: revoke the user's whole family.
            List<RefreshToken> active = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(token.getUser().getId());
            active.forEach(t -> t.setRevokedAt(now));
            refreshTokenRepository.saveAll(active);
            throw new InvalidRefreshTokenException();
        }
        if (token.getExpiresAt().isBefore(now)) {
            throw new InvalidRefreshTokenException();
        }
        token.setRevokedAt(now);
        refreshTokenRepository.save(token);
        return issue(token.getUser());
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
