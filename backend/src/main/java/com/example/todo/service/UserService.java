package com.example.todo.service;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import com.example.todo.repository.UserRepository;
import com.example.todo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import com.example.todo.exception.DomainException;
import com.example.todo.exception.ErrorKind;
import com.example.todo.exception.InvalidResetTokenException;
import com.example.todo.exception.ResetTokenExpiredException;
import com.example.todo.exception.UserAlreadyExistsException;

@Service
public class UserService {
    private static final String TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int TOKEN_LENGTH = 6;
    private static final long TOKEN_TTL_HOURS = 1L;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public User register(String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException();
        }
        String hashed = passwordEncoder.encode(rawPassword);
        User user = new User(email, hashed);
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new UserAlreadyExistsException();
        }
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public String requestReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "";
        }
        User user = userOpt.get();
        String token = generateToken();
        user.setResetToken(token);
        user.setResetExpires(LocalDateTime.now(clock).plusHours(TOKEN_TTL_HOURS));
        userRepository.save(user);
        return token;
    }

    public void verifyResetToken(String token) {
        requireValidToken(token);
    }

    @Transactional
    public void changePasswordViaReset(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new DomainException(ErrorKind.PASSWORD_MISMATCH, "confirmPassword", "Passwords do not match");
        }
        User user = requireValidToken(token);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetExpires(null);
        userRepository.save(user);
    }

    // Single validity rule shared by verification and change.
    private User requireValidToken(String token) {
        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isEmpty()) {
            throw new InvalidResetTokenException();
        }
        User user = userOpt.get();
        if (user.getResetExpires() == null || user.getResetExpires().isBefore(LocalDateTime.now(clock))) {
            throw new ResetTokenExpiredException();
        }
        return user;
    }

    private String generateToken() {
        StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            sb.append(TOKEN_ALPHABET.charAt(ThreadLocalRandom.current().nextInt(TOKEN_ALPHABET.length())));
        }
        return sb.toString();
    }
}
