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

    public TaskResponse() {}

    public TaskResponse(Long id, String title, String description, Priority priority, LocalDate dueDate,
                        TaskStatus status, java.util.List<TagResponse> tags, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = status;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
}
