package com.example.todo.service;

import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Owns the task ownership policy: lookup staying here (404), the forbidden
 * decision living in {@link CurrentUserProvider#requireOwned} (403), plus the
 * cascade rules for soft delete and restore. Every task-reading service crosses
 * this seam instead of re-implementing {@code findById -> 404 -> requireOwned}.
 */
@Service
public class TaskAccess {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUser;

    public TaskAccess(TaskRepository taskRepository, CurrentUserProvider currentUser) {
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
    }

    /** A live (not soft-deleted) task owned by the current user. */
    public Task owned(Long id) {
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (task.getDeletedAt() != null) {
            throw new ResourceNotFoundException();
        }
        currentUser.requireOwned(task.getUser().getId());
        return task;
    }

    /** An owned task regardless of its soft-deleted state (for restore). */
    public Task ownedIncludingDeleted(Long id) {
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(task.getUser().getId());
        return task;
    }

    /** Soft-deletes a task and its children in one write. */
    public void softDelete(Task task) {
        LocalDateTime now = LocalDateTime.now();
        task.setDeletedAt(now);
        for (Task child : task.getChildren()) {
            child.setDeletedAt(now);
        }
        taskRepository.save(task);
    }

    /** Restores a soft-deleted task and its children; no-op when already live. */
    public void restore(Task task) {
        if (task.getDeletedAt() == null) {
            return;
        }
        task.setDeletedAt(null);
        for (Task child : task.getChildren()) {
            child.setDeletedAt(null);
        }
        taskRepository.save(task);
    }
}
