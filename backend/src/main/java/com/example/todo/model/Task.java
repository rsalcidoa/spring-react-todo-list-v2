package com.example.todo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.util.HashSet;
import com.example.todo.model.Priority;
import com.example.todo.model.TaskStatus;
import com.example.todo.model.Tag;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "due_date")
    private LocalDate dueDate;

    // Task status – defaults to PENDING on creation
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    // Many-to-many relation to tags via join table `task_tags`
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "task_tags",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Task parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<Task> children = new HashSet<>();

    @Column(name = "created_at", nullable=false)
    private LocalDateTime createdAt;

    @Column(name="updated_at", nullable=false)
    private LocalDateTime updatedAt;

    @Column(name = "reminder_at")
    private LocalDateTime reminderAt;

    @Column(name = "reminder_notified_at")
    private LocalDateTime reminderNotifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Recurrence recurrence = Recurrence.NONE;

    @Column(name = "recurrence_source_id")
    private Long recurrenceSourceId;

    public Task() {
        this.status = TaskStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public Set<Tag> getTags() { return tags; }
    public void setTags(Set<Tag> tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getReminderAt() { return reminderAt; }
    public void setReminderAt(LocalDateTime reminderAt) { this.reminderAt = reminderAt; }
    public LocalDateTime getReminderNotifiedAt() { return reminderNotifiedAt; }
    public void setReminderNotifiedAt(LocalDateTime reminderNotifiedAt) { this.reminderNotifiedAt = reminderNotifiedAt; }
    public Recurrence getRecurrence() { return recurrence; }
    public void setRecurrence(Recurrence recurrence) { this.recurrence = recurrence; }
    public Long getRecurrenceSourceId() { return recurrenceSourceId; }
    public void setRecurrenceSourceId(Long recurrenceSourceId) { this.recurrenceSourceId = recurrenceSourceId; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public Task getParent() { return parent; }
    public void setParent(Task parent) { this.parent = parent; }
    public Set<Task> getChildren() { return children; }
    public void setChildren(Set<Task> children) { this.children = children; }
}
