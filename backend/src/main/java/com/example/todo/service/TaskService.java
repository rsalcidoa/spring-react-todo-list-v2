package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.dto.TaskQuery;
import com.example.todo.dto.TaskSortField;
import com.example.todo.dto.SortDirection;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.exception.InvalidQueryValueException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.exception.TagAlreadyExistsException;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.model.Tag;
import com.example.todo.model.Priority;
import com.example.todo.model.Recurrence;
import com.example.todo.model.TaskStatus;
import com.example.todo.repository.TaskRepository;
import com.example.todo.repository.TagRepository;
import com.example.todo.repository.ProjectRepository;
import com.example.todo.model.Project;
import com.example.todo.security.CurrentUserProvider;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
@Service
public class TaskService {
    private static final int MAX_ATTEMPTS = 2;

    private final TaskRepository taskRepository;
    private final TagRepository tagRepository;
    private final TagService tagService;
    private final CurrentUserProvider currentUser;
    private final TransactionTemplate transactionTemplate;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, TagRepository tagRepository, TagService tagService,
                       CurrentUserProvider currentUser, PlatformTransactionManager transactionManager,
                       ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.tagRepository = tagRepository;
        this.tagService = tagService;
        this.currentUser = currentUser;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.projectRepository = projectRepository;
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

    public List<TaskResponse> getAllTasksByStatus(String rawStatus) {
        return getAllTasksByStatus(parseStatus(rawStatus));
    }

    public List<TaskResponse> getAllTasks(TaskQuery query) {
        User me = currentUser.requireCurrent();
        return taskRepository.findAll(taskSpecification(me, query)).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Specification<Task> taskSpecification(User me, TaskQuery query) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user"), me));

            if (query.status() != null) {
                predicates.add(cb.equal(root.get("status"), query.status()));
            }
            if (query.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), query.priority()));
            }
            if (query.q() != null) {
                String like = "%" + query.q().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), like)));
            }
            if (!query.tagIds().isEmpty()) {
                predicates.add(root.join("tags").get("id").in(query.tagIds()));
                cq.distinct(true);
            }

            applyOrdering(cb, cq, root, query);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void applyOrdering(CriteriaBuilder cb, CriteriaQuery<?> cq, Root<Task> root, TaskQuery query) {
        boolean asc = query.dir() == SortDirection.asc;
        List<Order> orders = new ArrayList<>();

        switch (query.sort()) {
            case priority -> {
                var rank = cb.selectCase()
                        .when(cb.equal(root.get("priority"), Priority.LOW), 0)
                        .when(cb.equal(root.get("priority"), Priority.MEDIUM), 1)
                        .otherwise(2);
                orders.add(asc ? cb.asc(rank) : cb.desc(rank));
            }
            case dueDate -> {
                var path = root.get("dueDate");
                orders.add(cb.asc(cb.isNull(path)));
                orders.add(asc ? cb.asc(path) : cb.desc(path));
            }
            case title -> orders.add(asc ? cb.asc(cb.lower(root.get("title"))) : cb.desc(cb.lower(root.get("title"))));
            case createdAt -> orders.add(asc ? cb.asc(root.get("createdAt")) : cb.desc(root.get("createdAt")));
        }

        if (query.sort() != TaskSortField.createdAt) {
            orders.add(cb.desc(root.get("createdAt")));
        }
        cq.orderBy(orders);
    }

    public TaskResponse getTaskById(Long id) {
        User me = currentUser.requireCurrent();
        return toResponse(findOwnedTask(id, me));
    }

    public TaskResponse createTask(TaskRequest request) {
        User me = currentUser.requireCurrent();
        Task task = new Task();
        applyFields(task, request);
        applyProject(task, request);
        validateRecurrence(task);
        task.setUser(me);
        Set<String> tagNames = request.getTagNames();
        return withTagRetry(() -> {
            if (tagNames != null && !tagNames.isEmpty()) {
                assignTags(task, me, tagNames);
            }
            taskRepository.save(task);
            return toResponse(task);
        });
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        applyFields(task, request);
        applyProject(task, request);
        validateRecurrence(task);
        Set<String> tagNames = request.getTagNames();
        return withTagRetry(() -> {
            if (tagNames != null) {
                assignTags(task, me, tagNames);
            }
            taskRepository.save(task);
            generateNextOccurrence(task, me);
            return toResponse(task);
        });
    }

    // Single retry driver for tag contention: one fresh transaction per
    // attempt so re-resolution reuses tags committed concurrently.
    private TaskResponse withTagRetry(java.util.function.Supplier<TaskResponse> attempt) {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            try {
                return transactionTemplate.execute(status -> attempt.get());
            } catch (DataIntegrityViolationException e) {
                // retry: re-resolve reuses tags committed by the concurrent transaction
            }
        }
        throw new TagAlreadyExistsException();
    }

    private void applyFields(Task task, TaskRequest request) {
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setReminderAt(parseReminderAt(request.getReminderAt()));
        task.setReminderNotifiedAt(null);
        task.setRecurrence(parseRecurrence(request.getRecurrence()));
        if (request.getStatus() != null) {
            task.setStatus(parseStatus(request.getStatus()));
        }
    }

    private Recurrence parseRecurrence(String raw) {
        if (raw == null || raw.isBlank()) {
            return Recurrence.NONE;
        }
        try {
            return Recurrence.valueOf(raw.trim());
        } catch (IllegalArgumentException e) {
            throw new InvalidQueryValueException("recurrence", "Recurrence must be NONE, DAILY, WEEKLY or MONTHLY");
        }
    }

    private void validateRecurrence(Task task) {
        if (task.getRecurrence() != null && task.getRecurrence() != Recurrence.NONE && task.getDueDate() == null) {
            throw new InvalidQueryValueException("recurrence", "Recurrence requires a due date");
        }
    }

    private void applyProject(Task task, TaskRequest request) {
        if (request.getProjectId() == null) {
            task.setProject(null);
            return;
        }
        User me = currentUser.requireCurrent();
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new InvalidQueryValueException("projectId", "Project not found"));
        if (!project.getUser().getId().equals(me.getId())) {
            throw new InvalidQueryValueException("projectId", "Project not found");
        }
        task.setProject(project);
    }

    private void generateNextOccurrence(Task completed, User me) {
        if (completed.getStatus() != TaskStatus.COMPLETED) {
            return;
        }
        Recurrence rule = completed.getRecurrence();
        if (rule == null || rule == Recurrence.NONE || completed.getDueDate() == null) {
            return;
        }
        if (taskRepository.existsByRecurrenceSourceId(completed.getId())) {
            return;
        }
        Task next = new Task();
        next.setTitle(completed.getTitle());
        next.setDescription(completed.getDescription());
        next.setPriority(completed.getPriority());
        next.setStatus(TaskStatus.PENDING);
        next.setDueDate(RecurrenceRule.nextDueDate(completed.getDueDate(), rule));
        next.setRecurrence(rule);
        next.setUser(me);
        next.setTags(new java.util.HashSet<>(completed.getTags()));
        if (completed.getReminderAt() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(completed.getDueDate(), next.getDueDate());
            next.setReminderAt(completed.getReminderAt().plusDays(days));
        }
        next.setRecurrenceSourceId(completed.getId());
        taskRepository.save(next);
    }

    private LocalDateTime parseReminderAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw.trim());
        } catch (java.time.format.DateTimeParseException e) {
            throw new InvalidQueryValueException("reminderAt", "Invalid reminder timestamp");
        }
    }

    public TaskResponse applyStatus(Long id, String rawStatus) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        task.setStatus(parseStatus(rawStatus));
        taskRepository.save(task);
        generateNextOccurrence(task, me);
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
        // Values cross the tag module seam; entities are attached mechanically by id.
        List<Long> ids = tagService.resolve(me, new ArrayList<>(tagNames)).stream()
                .map(TagResponse::getId)
                .collect(Collectors.toList());
        List<Tag> managed = tagRepository.findAllById(ids);
        task.getTags().clear();
        task.getTags().addAll(managed);
    }

    public void deleteTask(Long id) {
        User me = currentUser.requireCurrent();
        Task task = findOwnedTask(id, me);
        taskRepository.delete(task);
    }

    // Ownership operation: lookup stays here (404), the forbidden decision
    // lives in CurrentUserProvider.requireOwned (shared with tags).
    private Task findOwnedTask(Long id, User me) {
        Task task = taskRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(task.getUser().getId());
        return task;
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.of(task);
    }
}
