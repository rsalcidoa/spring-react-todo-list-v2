package com.example.todo.service;

import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.InvalidQueryValueException;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

/** Owns the manual ordering of tasks within their status column. */
@Service
public class TaskOrderingService {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUser;
    private final TaskAccess taskAccess;

    public TaskOrderingService(TaskRepository taskRepository, CurrentUserProvider currentUser, TaskAccess taskAccess) {
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
        this.taskAccess = taskAccess;
    }

    public TaskResponse reorder(Long id, String rawStatus, double position) {
        currentUser.requireCurrent();
        if (Double.isNaN(position) || Double.isInfinite(position)) {
            throw new InvalidQueryValueException("position", "Position must be a finite number");
        }
        Task task = taskAccess.owned(id);
        task.setStatus(TaskStatus.parse(rawStatus));
        task.setPosition(position);
        taskRepository.save(task);
        return TaskResponse.of(task);
    }
}
