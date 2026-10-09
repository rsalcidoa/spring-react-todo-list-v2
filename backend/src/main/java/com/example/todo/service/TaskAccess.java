package com.example.todo.service;

import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import com.example.todo.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Owns the Task-specific access policy on top of {@link Ownership}: a soft-deleted
 * Task is treated as absent (404) before the ownership decision, plus the
 * cascade rules for soft delete and restore. Every task-reading service crosses
 * this seam instead of re-implementing {@code findById -> 404 -> requireOwned}.
 */
@Service
public class TaskAccess {

    private final TaskRepository taskRepository;
    private final Ownership ownership;

    public TaskAccess(TaskRepository taskRepository, Ownership ownership) {
        this.taskRepository = taskRepository;
        this.ownership = ownership;
    }

    /** A live (not soft-deleted) task owned by the current user. */
    public Task owned(Long id) {
        Task task = ownership.lookup(id, taskRepository::findById);
        if (task.getDeletedAt() != null) {
            throw new ResourceNotFoundException();
        }
        return ownership.requireOwned(task, t -> t.getUser().getId());
    }

    /** An owned task regardless of its soft-deleted state (for restore). */
    public Task ownedIncludingDeleted(Long id) {
        return ownership.requireOwned(id, taskRepository::findById, t -> t.getUser().getId());
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

    /** Records when a task becomes COMPLETED and clears it when it leaves COMPLETED. */
    public void applyCompletionTimestamp(Task task, TaskStatus previousStatus) {
        if (task.getStatus() == TaskStatus.COMPLETED) {
            if (previousStatus != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            }
        } else {
            task.setCompletedAt(null);
        }
    }
}
