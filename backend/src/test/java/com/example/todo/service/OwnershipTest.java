package com.example.todo.service;

import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.User;
import com.example.todo.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OwnershipTest {

    private CurrentUserProvider currentUser;
    private Ownership ownership;

    private final User me = userWithId(1L, "me@example.com");

    /** Minimal owner-id carrier so the policy is tested without an entity. */
    record Resource(long ownerId) {}

    @BeforeEach
    void setUp() {
        currentUser = mock(CurrentUserProvider.class);
        ownership = new Ownership(currentUser);
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    @Test
    void lookupReturnsTheEntity() {
        Resource resource = new Resource(1L);
        assertSame(resource, ownership.lookup(9L, id -> Optional.of(resource)));
    }

    @Test
    void lookupThrowsNotFoundWhenAbsent() {
        assertThrows(ResourceNotFoundException.class, () -> ownership.lookup(9L, id -> Optional.empty()));
    }

    @Test
    void requireOwnedThrowsForForeignResource() {
        Resource resource = new Resource(2L);
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> ownership.requireOwned(resource, Resource::ownerId));
    }

    @Test
    void composedRequireOwnedReturnsWhenOwned() {
        Resource resource = new Resource(1L);
        when(currentUser.requireOwned(1L)).thenReturn(me);

        assertSame(resource, ownership.requireOwned(10L, id -> Optional.of(resource), Resource::ownerId));
    }

    @Test
    void composedRequireOwnedThrowsNotFoundWhenAbsent() {
        assertThrows(ResourceNotFoundException.class,
                () -> ownership.requireOwned(9L, id -> Optional.empty(), Resource::ownerId));
    }
}
