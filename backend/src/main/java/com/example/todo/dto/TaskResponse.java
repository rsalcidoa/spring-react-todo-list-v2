package com.example.todo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.example.todo.model.TaskStatus;
import com.example.todo.model.Priority;
import com.fasterxml.jackson.annotation.JsonFormat;

public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Priority priority;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    private TaskStatus status;
    private java.util.List<TagResponse> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reminderAt;
    private com.example.todo.model.Recurrence recurrence;
    private Long projectId;
    private String projectName;
    private Long parentId;
    private Progress subtaskProgress;

    public record Progress(int done, int total) {}

    public TaskResponse() {}

    public TaskResponse(Long id, String title, String description, Priority priority, LocalDate dueDate,
                        TaskStatus status, java.util.List<TagResponse> tags, LocalDateTime createdAt, LocalDateTime updatedAt,
                        LocalDateTime reminderAt, com.example.todo.model.Recurrence recurrence,
                        Long projectId, String projectName, Long parentId, Progress subtaskProgress) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = status;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.reminderAt = reminderAt;
        this.recurrence = recurrence;
        this.projectId = projectId;
        this.projectName = projectName;
        this.parentId = parentId;
        this.subtaskProgress = subtaskProgress;
    }

    /** Maps a task entity to its response, exposing only tag values and no entity internals. */
    public static TaskResponse of(com.example.todo.model.Task task) {
        java.util.List<TagResponse> tags = task.getTags().stream()
                .map(t -> new TagResponse(t.getId(), t.getName()))
                .sorted(java.util.Comparator.comparing(TagResponse::getName))
                .collect(java.util.stream.Collectors.toList());
        com.example.todo.model.Project project = task.getProject();
        com.example.todo.model.Task parent = task.getParent();
        java.util.Set<com.example.todo.model.Task> children = task.getChildren();
        int total = children == null ? 0 : children.size();
        int done = children == null ? 0 : (int) children.stream()
                .filter(c -> c.getStatus() == TaskStatus.COMPLETED)
                .count();
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getDueDate(),
                task.getStatus(),
                tags,
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getReminderAt(),
                task.getRecurrence(),
                project != null ? project.getId() : null,
                project != null ? project.getName() : null,
                parent != null ? parent.getId() : null,
                new Progress(done, total));
    }

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    @JsonFormat(pattern = "yyyy-MM-dd")
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public java.util.List<TagResponse> getTags() { return tags; }
    public void setTags(java.util.List<TagResponse> tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getReminderAt() { return reminderAt; }
    public void setReminderAt(LocalDateTime reminderAt) { this.reminderAt = reminderAt; }
    public com.example.todo.model.Recurrence getRecurrence() { return recurrence; }
    public void setRecurrence(com.example.todo.model.Recurrence recurrence) { this.recurrence = recurrence; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public Progress getSubtaskProgress() { return subtaskProgress; }
    public void setSubtaskProgress(Progress subtaskProgress) { this.subtaskProgress = subtaskProgress; }
}
