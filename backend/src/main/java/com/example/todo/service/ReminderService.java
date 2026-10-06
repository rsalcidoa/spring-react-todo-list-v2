package com.example.todo.service;

import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Computes and acknowledges due task reminders. Due-ness is evaluated on read
 * (no scheduler); {@code reminderNotifiedAt} makes delivery idempotent.
 */
@Service
public class ReminderService {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public ReminderService(TaskRepository taskRepository, CurrentUserProvider currentUser, Clock clock) {
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public List<TaskResponse> dueReminders() {
        User me = currentUser.requireCurrent();
        return taskRepository
                .findByUserAndReminderAtLessThanEqualAndReminderNotifiedAtIsNull(me, LocalDateTime.now(clock))
                .stream()
                .map(TaskResponse::of)
                .collect(Collectors.toList());
    }

    public TaskResponse acknowledge(Long id) {
        User me = currentUser.requireCurrent();
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(task.getUser().getId());
        if (task.getReminderNotifiedAt() == null) {
            task.setReminderNotifiedAt(LocalDateTime.now(clock));
            taskRepository.save(task);
        }
        return TaskResponse.of(task);
    }
}
