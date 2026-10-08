package com.example.todo.controller;

import com.example.todo.dto.PageResponse;
import com.example.todo.dto.PositionUpdateRequest;
import com.example.todo.dto.StatusUpdateRequest;
import com.example.todo.dto.TaskQuery;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.service.TaskModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/v1/tasks")
public class TaskController {
    private final TaskModule taskModule;

    @Autowired
    public TaskController(TaskModule taskModule) {
        this.taskModule = taskModule;
    }

    /**
     * Retrieve the authenticated user's tasks with optional, composable
     * filters. Raw parameters are parsed by the Task module so invalid values
     * yield the structured 400 contract instead of a generic conversion error.
     */
    @GetMapping
    public ResponseEntity<?> getAllTasks(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "priority", required = false) String priority,
            @RequestParam(name = "tagIds", required = false) List<String> tagIds,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "dir", required = false) String dir,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size) {
        TaskQuery query = TaskQuery.parse(status, q, priority, tagIds, sort, dir);
        Optional<Pageable> pageable = TaskQuery.pageable(page, size);
        if (pageable.isPresent()) {
            Page<TaskResponse> result = taskModule.list(query, pageable.get());
            return ResponseEntity.ok(new PageResponse<>(
                    result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements()));
        }
        return ResponseEntity.ok(taskModule.list(query));
    }

    /**
     * Retrieve a specific task belonging to the authenticated user.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskModule.get(id));
    }

    /**
     * Reminders that are due and not yet notified for the authenticated user.
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<TaskResponse>> getDueReminders() {
        return ResponseEntity.ok(taskModule.dueReminders());
    }

    /**
     * Subtasks of an owned parent task.
     */
    @GetMapping("/{id}/subtasks")
    public ResponseEntity<List<TaskResponse>> getSubtasks(@PathVariable Long id) {
        return ResponseEntity.ok(taskModule.subtasks(id));
    }

    /**
     * Mark a task's reminder as delivered (idempotent).
     */
    @PostMapping("/{id}/reminder-ack")
    public ResponseEntity<TaskResponse> ackReminder(@PathVariable Long id) {
        return ResponseEntity.ok(taskModule.acknowledgeReminder(id));
    }

    /**
     * Create a new task for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse created = taskModule.create(request);
        return ResponseEntity.status(201).body(created);
    }

    /**
     * Update an existing task belonging to the authenticated user.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskModule.update(id, request));
    }

    /**
     * Delete a task belonging to the authenticated user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskModule.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restore a soft-deleted task belonging to the authenticated user.
     */
    @PostMapping("/{id}/restore")
    public ResponseEntity<TaskResponse> restoreTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskModule.restore(id));
    }

    /**
     * Update only the status of a task (used by Kanban drag-and-drop).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> patchStatus(@PathVariable Long id, @Valid @RequestBody(required = false) StatusUpdateRequest request) {
        if (request == null) {
            throw new InvalidStatusValueException("status", "Status must not be blank");
        }
        return ResponseEntity.ok(taskModule.changeStatus(id, request.getStatus()));
    }

    /**
     * Set a task's status and manual position atomically (drag within/across columns).
     */
    @PatchMapping("/{id}/position")
    public ResponseEntity<TaskResponse> patchPosition(@PathVariable Long id, @Valid @RequestBody PositionUpdateRequest request) {
        return ResponseEntity.ok(taskModule.reorder(id, request.getStatus(), request.getPosition()));
    }
}
