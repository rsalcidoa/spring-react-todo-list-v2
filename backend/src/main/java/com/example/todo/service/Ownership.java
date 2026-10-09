package com.example.todo.service;

import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.function.Function;

/**
 * Owns the resource-ownership policy shared by Tasks, Tags and Projects: a
 * lookup that stays here (404 when absent) and the forbidden decision living in
 * {@link CurrentUserProvider#requireOwned} (403 when not the owner). Services
 * cross this seam instead of re-implementing {@code findById -> 404 ->
 * requireOwned}.
 */
@Service
public class Ownership {

    private final CurrentUserProvider currentUser;

    public Ownership(CurrentUserProvider currentUser) {
        this.currentUser = currentUser;
    }

    /** Loads a resource by id, 404 when absent. */
    public <T> T lookup(Long id, Function<Long, Optional<T>> findById) {
        return findById.apply(id).orElseThrow(ResourceNotFoundException::new);
    }

    /** Enforces that the current user owns the resource, 403 otherwise. */
    public <T> T requireOwned(T entity, Function<T, Long> ownerId) {
        currentUser.requireOwned(ownerId.apply(entity));
        return entity;
    }

    /** Loads a resource by id (404) and enforces ownership (403). */
    public <T> T requireOwned(Long id, Function<Long, Optional<T>> findById, Function<T, Long> ownerId) {
        return requireOwned(lookup(id, findById), ownerId);
    }
}
