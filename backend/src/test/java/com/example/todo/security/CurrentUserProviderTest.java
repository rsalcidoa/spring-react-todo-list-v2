package com.example.todo.security;

import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.UnauthenticatedException;
import com.example.todo.model.User;
import com.example.todo.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CurrentUserProviderTest {

    private UserRepository userRepository;
    private CurrentUserProvider provider;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userRepository = mock(UserRepository.class);
        provider = new CurrentUserProvider(userRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    private void authenticateAs(String email) {
        org.springframework.security.core.userdetails.User principal =
                new org.springframework.security.core.userdetails.User(email, "password", List.of());
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void currentResolvesAuthenticatedUser() {
        User persisted = userWithId(1L, "a@example.com");
        when(userRepository.findByEmail("a@example.com")).thenReturn(Optional.of(persisted));
        authenticateAs("a@example.com");

        Optional<User> current = provider.current();

        assertTrue(current.isPresent());
        assertEquals(1L, current.get().getId());
    }

    @Test
    void currentIsEmptyWithoutAuthentication() {
        assertTrue(provider.current().isEmpty());
    }

    @Test
    void currentIsEmptyForAnonymousPrincipal() {
        var anonymousAuthority = new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ANONYMOUS");
        SecurityContextHolder.getContext()
                .setAuthentication(new AnonymousAuthenticationToken("anon", "anonymousUser", List.of(anonymousAuthority)));

        assertTrue(provider.current().isEmpty());
    }

    @Test
    void requireCurrentReturnsAuthenticatedUser() {
        User persisted = userWithId(2L, "b@example.com");
        when(userRepository.findByEmail("b@example.com")).thenReturn(Optional.of(persisted));
        authenticateAs("b@example.com");

        assertSame(persisted, provider.requireCurrent());
    }

    @Test
    void requireCurrentThrowsWithoutAuthentication() {
        assertThrows(UnauthenticatedException.class, () -> provider.requireCurrent());
    }

    @Test
    void requireOwnedReturnsCurrentUserWhenOwnerMatches() {
        User persisted = userWithId(3L, "c@example.com");
        when(userRepository.findByEmail("c@example.com")).thenReturn(Optional.of(persisted));
        authenticateAs("c@example.com");

        assertSame(persisted, provider.requireOwned(3L));
    }

    @Test
    void requireOwnedThrowsWhenOwnerDiffers() {
        User persisted = userWithId(4L, "d@example.com");
        when(userRepository.findByEmail("d@example.com")).thenReturn(Optional.of(persisted));
        authenticateAs("d@example.com");

        assertThrows(OwnershipDeniedException.class, () -> provider.requireOwned(99L));
    }
}
