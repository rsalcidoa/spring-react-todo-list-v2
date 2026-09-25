package com.example.todo.config;

import com.example.todo.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private JwtUtil jwtUtil;
    private UserDetailsService userDetailsService;
    private JwtAuthenticationFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        userDetailsService = mock(UserDetailsService.class);
        filter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        chain = mock(FilterChain.class);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validTokenAuthenticates() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer valid");
        when(jwtUtil.validateToken("valid")).thenReturn(true);
        when(jwtUtil.extractUsername("valid")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com"))
                .thenReturn(new User("user@example.com", "hash", List.of()));

        filter.doFilter(request, response, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }

    @Test
    void invalidTokenProceedsWithoutAuth() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer bogus");
        when(jwtUtil.validateToken("bogus")).thenReturn(false);

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }

    @Test
    void unknownUserProceedsWithoutAuth() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer orphan");
        when(jwtUtil.validateToken("orphan")).thenReturn(true);
        when(jwtUtil.extractUsername("orphan")).thenReturn("ghost@example.com");
        when(userDetailsService.loadUserByUsername("ghost@example.com"))
                .thenThrow(new UsernameNotFoundException("ghost@example.com"));

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }

    @Test
    void unexpectedErrorPropagatesInsteadOfSilenced() {
        when(request.getHeader("Authorization")).thenReturn("Bearer valid");
        when(jwtUtil.validateToken("valid")).thenReturn(true);
        when(jwtUtil.extractUsername(anyString())).thenThrow(new RuntimeException("store down"));

        assertThrows(RuntimeException.class, () -> filter.doFilter(request, response, chain));
    }

    @Test
    void missingHeaderProceedsWithoutAuth() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }
}
