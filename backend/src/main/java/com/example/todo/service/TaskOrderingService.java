package com.example.todo.service;

import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.InvalidQueryValueException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import com.example.todo.model.User;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

/** Owns the manual ordering of tasks within their status column. */
@Service
public class TaskOrderingService {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUser;

    public TaskOrderingService(TaskRepository taskRepository, CurrentUserProvider currentUser) {
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
    }

    public TaskResponse reorder(Long id, String rawStatus, double position) {
        User me = currentUser.requireCurrent();
        if (Double.isNaN(position) || Double.isInfinite(position)) {
            throw new InvalidQueryValueException("position", "Position must be a finite number");
        }
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(task.getUser().getId());
        task.setStatus(parseStatus(rawStatus));
        task.setPosition(position);
        taskRepository.save(task);
        return TaskResponse.of(task);
    }

    private TaskStatus parseStatus(String rawStatus) {
        try {
            return TaskStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new InvalidQueryValueException("status", "Status must be PENDING, ACTIVE or COMPLETED");
        }
    }
}
