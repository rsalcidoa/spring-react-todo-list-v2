package com.example.todo.service;

import com.example.todo.exception.DomainException;
import com.example.todo.exception.InvalidResetTokenException;
import com.example.todo.exception.ResetTokenExpiredException;
import com.example.todo.model.User;
import com.example.todo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserRepository userRepository;
    private UserService service;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private Clock clock;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
        service = new UserService(userRepository, encoder, clock);
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    @Test
    void requestResetReturnsSixCharAlphanumericTokenAndStoresExpiry() {
        User user = userWithId(1L, "me@example.com");
        when(userRepository.findByEmail("me@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        String token = service.requestReset("me@example.com");

        assertNotNull(token);
        assertTrue(Pattern.matches("[A-Z0-9]{6}", token), "token must be 6-char uppercase alphanumeric, got: " + token);
        assertEquals(token, user.getResetToken());
        assertNotNull(user.getResetExpires());
        LocalDateTime now = LocalDateTime.now(clock);
        assertTrue(user.getResetExpires().isAfter(now.plusMinutes(55)), "expiry should be ~1h in future");
        assertTrue(user.getResetExpires().isBefore(now.plusHours(2)), "expiry should be <2h in future");
    }

    @Test
    void requestResetForUnknownEmailReturnsEmptyStringAndDoesNotSave() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        String token = service.requestReset("nobody@example.com");

        assertEquals("", token);
        verify(userRepository, org.mockito.Mockito.never()).save(any(User.class));
    }

    @Test
    void requestResetGeneratesDistinctTokensOnRepeatedCalls() {
        User user = userWithId(1L, "me@example.com");
        when(userRepository.findByEmail("me@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        String first = service.requestReset("me@example.com");
        String second = service.requestReset("me@example.com");

        assertNotEquals(first, second);
    }

    @Test
    void verifyResetTokenAcceptsValidToken() {
        User user = userWithId(1L, "me@example.com");
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now().plusHours(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));

        assertDoesNotThrow(() -> service.verifyResetToken("ABC123"));
    }

    @Test
    void verifyResetTokenUnknownTokenThrowsInvalid() {
        when(userRepository.findByResetToken("NOPE99")).thenReturn(Optional.empty());

        assertThrows(InvalidResetTokenException.class, () -> service.verifyResetToken("NOPE99"));
    }

    @Test
    void verifyResetTokenExpiredTokenThrowsExpired() {
        User user = userWithId(1L, "me@example.com");
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now(clock).minusMinutes(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));

        assertThrows(ResetTokenExpiredException.class, () -> service.verifyResetToken("ABC123"));
    }

    @Test
    void changePasswordViaResetUpdatesHashAndClearsToken() {
        User user = userWithId(1L, "me@example.com");
        user.setPassword(encoder.encode("oldpass1"));
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now(clock).plusHours(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.changePasswordViaReset("ABC123", "newpass1", "newpass1");

        assertNotEquals("oldpass1", user.getPassword());
        assertTrue(encoder.matches("newpass1", user.getPassword()), "password should be re-hashed with new value");
        assertNull(user.getResetToken(), "reset token must be cleared after change");
        assertNull(user.getResetExpires(), "reset expiry must be cleared after change");
    }

    @Test
    void changePasswordViaResetMismatchedConfirmationFailsWithoutTouchingUser() {
        User user = userWithId(1L, "me@example.com");
        user.setPassword(encoder.encode("oldpass1"));
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now(clock).plusHours(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));

        DomainException ex = assertThrows(DomainException.class,
                () -> service.changePasswordViaReset("ABC123", "newpass1", "otherpass"));
        assertEquals("Passwords do not match", ex.getMessage());
        assertEquals("ABC123", user.getResetToken(), "token must survive a mismatch");
        verify(userRepository, org.mockito.Mockito.never()).save(any(User.class));
    }

    @Test
    void verifyDoesNotConsumeTokenForLaterChange() {
        User user = userWithId(1L, "me@example.com");
        user.setPassword(encoder.encode("oldpass1"));
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now(clock).plusHours(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.verifyResetToken("ABC123"));
        assertDoesNotThrow(() -> service.verifyResetToken("ABC123"));
        service.changePasswordViaReset("ABC123", "newpass1", "newpass1");

        assertNull(user.getResetToken());
    }

    @Test
    void changePasswordViaResetUnknownTokenThrowsInvalid() {
        when(userRepository.findByResetToken("NOPE99")).thenReturn(Optional.empty());

        assertThrows(InvalidResetTokenException.class, () -> service.changePasswordViaReset("NOPE99", "newpass1", "newpass1"));
    }

    @Test
    void changePasswordViaResetExpiredTokenThrowsExpired() {
        User user = userWithId(1L, "me@example.com");
        user.setResetToken("ABC123");
        user.setResetExpires(LocalDateTime.now(clock).minusMinutes(1));
        when(userRepository.findByResetToken("ABC123")).thenReturn(Optional.of(user));

        assertThrows(ResetTokenExpiredException.class, () -> service.changePasswordViaReset("ABC123", "newpass1", "newpass1"));
    }
}
