package com.example.todo.service;

import com.example.todo.dto.TaskQuery;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * The task resource's single interface: one seam the controller (and tests)
 * cross for every task use case. Composes the domain services — listing and
 * CRUD in {@link TaskService}, ordering in {@link TaskOrderingService},
 * reminders in {@link ReminderService} — behind a value-oriented surface.
 */
@Service
public class TaskModule {

    private final TaskService taskService;
    private final TaskOrderingService orderingService;
    private final ReminderService reminderService;

    public TaskModule(TaskService taskService, TaskOrderingService orderingService, ReminderService reminderService) {
        this.taskService = taskService;
        this.orderingService = orderingService;
        this.reminderService = reminderService;
    }

    public List<TaskResponse> list(TaskQuery query) {
        return taskService.getAllTasks(query);
    }

    public Page<TaskResponse> list(TaskQuery query, Pageable pageable) {
        return taskService.getAllTasks(query, pageable);
    }

    public TaskResponse get(Long id) {
        return taskService.getTaskById(id);
    }

    public TaskResponse create(TaskRequest request) {
        return taskService.createTask(request);
    }

    public TaskResponse update(Long id, TaskRequest request) {
        return taskService.updateTask(id, request);
    }

    public TaskResponse changeStatus(Long id, String status) {
        return taskService.applyStatus(id, status);
    }

    public TaskResponse reorder(Long id, String status, double position) {
        return orderingService.reorder(id, status, position);
    }

    public void delete(Long id) {
        taskService.deleteTask(id);
    }

    public TaskResponse restore(Long id) {
        return taskService.restoreTask(id);
    }

    public List<TaskResponse> subtasks(Long id) {
        return taskService.getSubtasks(id);
    }

    public List<TaskResponse> dueReminders() {
        return reminderService.dueReminders();
    }

    public TaskResponse acknowledgeReminder(Long id) {
        return reminderService.acknowledge(id);
    }
}
