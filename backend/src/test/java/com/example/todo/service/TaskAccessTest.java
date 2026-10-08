package com.example.todo.service;

import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskAccessTest {

    private TaskRepository taskRepository;
    private CurrentUserProvider currentUser;
    private TaskAccess access;

    private final User me = userWithId(1L, "me@example.com");
    private final User other = userWithId(2L, "other@example.com");

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        currentUser = mock(CurrentUserProvider.class);
        access = new TaskAccess(taskRepository, currentUser);
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    private Task taskOwnedBy(Long id, User owner) {
        Task task = new Task();
        task.setId(id);
        task.setTitle("Task " + id);
        task.setUser(owner);
        return task;
    }

    @Test
    void ownedReturnsOwnTask() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertEquals(10L, access.owned(10L).getId());
    }

    @Test
    void ownedThrowsNotFoundWhenMissing() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> access.owned(99L));
    }

    @Test
    void ownedThrowsNotFoundWhenAlreadyDeleted() {
        Task task = taskOwnedBy(10L, me);
        task.setDeletedAt(LocalDateTime.now());
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertThrows(ResourceNotFoundException.class, () -> access.owned(10L));
    }

    @Test
    void ownedThrowsOwnershipDeniedForForeignTask() {
        Task task = taskOwnedBy(10L, other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> access.owned(10L));
    }

    @Test
    void ownedIncludingDeletedReturnsDeletedOwnTask() {
        Task task = taskOwnedBy(10L, me);
        task.setDeletedAt(LocalDateTime.now());
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertEquals(10L, access.ownedIncludingDeleted(10L).getId());
    }

    @Test
    void softDeleteCascadesToChildren() {
        Task task = taskOwnedBy(10L, me);
        Task child = taskOwnedBy(11L, me);
        task.setChildren(Set.of(child));

        access.softDelete(task);

        assertNotNull(task.getDeletedAt());
        assertNotNull(child.getDeletedAt());
        verify(taskRepository).save(task);
    }

    @Test
    void restoreBringsBackTaskAndChildren() {
        Task task = taskOwnedBy(10L, me);
        Task child = taskOwnedBy(11L, me);
        task.setChildren(Set.of(child));
        LocalDateTime deletedAt = LocalDateTime.now();
        task.setDeletedAt(deletedAt);
        child.setDeletedAt(deletedAt);

        access.restore(task);

        assertNull(task.getDeletedAt());
        assertNull(child.getDeletedAt());
        verify(taskRepository).save(task);
    }
}
