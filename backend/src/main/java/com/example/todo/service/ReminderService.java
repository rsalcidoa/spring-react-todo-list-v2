package com.example.todo.service;

import com.example.todo.dto.TaskResponse;
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
    private final TaskAccess taskAccess;

    public ReminderService(TaskRepository taskRepository, CurrentUserProvider currentUser, Clock clock, TaskAccess taskAccess) {
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
        this.clock = clock;
        this.taskAccess = taskAccess;
    }

    public List<TaskResponse> dueReminders() {
        User me = currentUser.requireCurrent();
        return taskRepository
                .findByUserAndReminderAtLessThanEqualAndReminderNotifiedAtIsNullAndDeletedAtIsNull(me, LocalDateTime.now(clock))
                .stream()
                .map(TaskResponse::of)
                .collect(Collectors.toList());
    }

    public TaskResponse acknowledge(Long id) {
        currentUser.requireCurrent();
        Task task = taskAccess.owned(id);
        if (task.getReminderNotifiedAt() == null) {
            task.setReminderNotifiedAt(LocalDateTime.now(clock));
            taskRepository.save(task);
        }
        return TaskResponse.of(task);
    }
}
