package com.example.todo.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test-secret-that-is-long-enough-for-hs256");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 3600000L);
        jwtUtil.init();
    }

    @Test
    void generateValidateExtractRoundtrip() {
        String token = jwtUtil.generateToken("user@example.com");

        assertTrue(jwtUtil.validateToken(token));
        assertEquals("user@example.com", jwtUtil.extractUsername(token));
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtUtil.generateToken("user@example.com");

        assertFalse(jwtUtil.validateToken(token + "tampered"));
    }

    @Test
    void expiredTokenIsRejected() {
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", -1000L);
        String token = jwtUtil.generateToken("user@example.com");

        assertFalse(jwtUtil.validateToken(token));
    }

    @Test
    void shortSecretFailsInit() {
        JwtUtil weak = new JwtUtil();
        ReflectionTestUtils.setField(weak, "secret", "short");
        ReflectionTestUtils.setField(weak, "jwtExpirationMs", 3600000L);

        assertThrows(IllegalStateException.class, weak::init);
    }
}
