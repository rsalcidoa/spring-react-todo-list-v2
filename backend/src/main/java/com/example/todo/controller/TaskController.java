package com.example.todo.controller;

import com.example.todo.dto.StatusUpdateRequest;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.dto.TaskQuery;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.service.TaskService;
import com.example.todo.service.ReminderService;
import com.example.todo.service.TaskOrderingService;
import com.example.todo.dto.PositionUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/v1/tasks")
public class TaskController {
    private final TaskService taskService;
    private final ReminderService reminderService;
    private final TaskOrderingService taskOrderingService;

    @Autowired
    public TaskController(TaskService taskService, ReminderService reminderService, TaskOrderingService taskOrderingService) {
        this.taskService = taskService;
        this.reminderService = reminderService;
        this.taskOrderingService = taskOrderingService;
    }

    /**
     * Retrieve the authenticated user's tasks with optional, composable
     * filters. Raw parameters are parsed by the Task module so invalid values
     * yield the structured 400 contract instead of a generic conversion error.
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "priority", required = false) String priority,
            @RequestParam(name = "tagIds", required = false) List<String> tagIds,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "dir", required = false) String dir) {
        TaskQuery query = TaskQuery.parse(status, q, priority, tagIds, sort, dir);
        return ResponseEntity.ok(taskService.getAllTasks(query));
    }

    /**
     * Retrieve a specific task belonging to the authenticated user.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    /**
     * Reminders that are due and not yet notified for the authenticated user.
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<TaskResponse>> getDueReminders() {
        return ResponseEntity.ok(reminderService.dueReminders());
    }

    /**
     * Subtasks of an owned parent task.
     */
    @GetMapping("/{id}/subtasks")
    public ResponseEntity<List<TaskResponse>> getSubtasks(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getSubtasks(id));
    }

    /**
     * Mark a task's reminder as delivered (idempotent).
     */
    @PostMapping("/{id}/reminder-ack")
    public ResponseEntity<TaskResponse> ackReminder(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.acknowledge(id));
    }

    /**
     * Create a new task for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse created = taskService.createTask(request);
        return ResponseEntity.status(201).body(created);
    }

    /**
     * Update an existing task belonging to the authenticated user.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    /**
     * Delete a task belonging to the authenticated user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update only the status of a task (used by Kanban drag-and-drop).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> patchStatus(@PathVariable Long id, @Valid @RequestBody(required = false) StatusUpdateRequest request) {
        if (request == null) {
            throw new InvalidStatusValueException("status", "Status must not be blank");
        }
        return ResponseEntity.ok(taskService.applyStatus(id, request.getStatus()));
    }

    /**
     * Set a task's status and manual position atomically (drag within/across columns).
     */
    @PatchMapping("/{id}/position")
    public ResponseEntity<TaskResponse> patchPosition(@PathVariable Long id, @Valid @RequestBody PositionUpdateRequest request) {
        return ResponseEntity.ok(taskOrderingService.reorder(id, request.getStatus(), request.getPosition()));
    }
}
