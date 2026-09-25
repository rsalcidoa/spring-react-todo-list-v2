package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.model.Tag;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private static final int MAX_ATTEMPTS = 2;

    private final TaskRepository taskRepository;
    private final TagService tagService;
    private final CurrentUserProvider currentUser;
    private final TransactionTemplate transactionTemplate;

    public TaskService(TaskRepository taskRepository, TagService tagService,
                       CurrentUserProvider currentUser, PlatformTransactionManager transactionManager) {
        this.taskRepository = taskRepository;
        this.tagService = tagService;
        this.currentUser = currentUser;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public List<TaskResponse> getAllTasks() {
        User me = currentUser.requireCurrent();
        return taskRepository.findByUser(me).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getAllTasksByStatus(com.example.todo.model.TaskStatus status) {
        User me = currentUser.requireCurrent();
        return taskRepository.findByUserAndStatus(me, status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        User me = currentUser.requireCurrent();
        return toResponse(findOwnedTask(id, me));
    }

    public TaskResponse createTask(TaskRequest request) {
        User me = currentUser.requireCurrent();
        Task task = new Task();
        applyFields(task, request);
        task.setUser(me);
        Set<String> tagNames = request.getTagNames();
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                return transactionTemplate.execute(status -> {
                    if (tagNames != null && !tagNames.isEmpty()) {
                        assignTags(task, me, tagNames);
                    }
                    taskRepository.save(task);
                    return toResponse(task);
                });
            } catch (DataIntegrityViolationException e) {
                // retry: re-resolve reuses tags committed by the concurrent transaction
            }
        }
        throw new IllegalStateException("Failed to save task after retries");
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        applyFields(task, request);
        Set<String> tagNames = request.getTagNames();
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                return transactionTemplate.execute(status -> {
                    if (tagNames != null) {
                        assignTags(task, me, tagNames);
                    }
                    taskRepository.save(task);
                    return toResponse(task);
                });
            } catch (DataIntegrityViolationException e) {
                // retry: re-resolve reuses tags committed by the concurrent transaction
            }
        }
        throw new IllegalStateException("Failed to save task after retries");
    }

    private void applyFields(Task task, TaskRequest request) {
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        if (request.getStatus() != null) {
            task.setStatus(parseStatus(request.getStatus()));
        }
    }

    public TaskResponse applyStatus(Long id, String rawStatus) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        task.setStatus(parseStatus(rawStatus));
        taskRepository.save(task);
        return toResponse(task);
    }

    private com.example.todo.model.TaskStatus parseStatus(String rawStatus) {
        try {
            return com.example.todo.model.TaskStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new InvalidStatusValueException("status", "Status must be PENDING, ACTIVE or COMPLETED");
        }
    }

    private void assignTags(Task task, User me, Set<String> tagNames) {
        List<Tag> tags = tagService.resolve(me, new ArrayList<>(tagNames));
        task.getTags().clear();
        task.getTags().addAll(tags);
    }

    public TaskResponse patchStatus(Long id, com.example.todo.model.TaskStatus newStatus) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        task.setStatus(newStatus);
        taskRepository.save(task);
        return toResponse(task);
    }

    public void deleteTask(Long id) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        taskRepository.delete(task);
    }

    // Ownership operation: 1 findById, 3 states (found / not-found / forbidden).
    private Task findOwnedTask(Long id, User me) {
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        if (!task.getUser().getId().equals(me.getId())) {
            throw new OwnershipDeniedException();
        }
        return task;
    }

    private TaskResponse toResponse(Task task) {
        java.util.List<TagResponse> tags = task.getTags().stream()
                .map(t -> new TagResponse(t.getId(), t.getName()))
                .sorted(java.util.Comparator.comparing(TagResponse::getName))
                .collect(Collectors.toList());
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getDueDate(),
                task.getStatus(),
                tags,
                task.getCreatedAt(),
                task.getUpdatedAt());
    }
}
