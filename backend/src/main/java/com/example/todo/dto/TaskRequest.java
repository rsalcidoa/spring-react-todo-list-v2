package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;
import com.example.todo.model.Priority;
import com.fasterxml.jackson.annotation.JsonFormat;

public class TaskRequest {
    @NotBlank(message="Title must not be blank")
    @Size(max=255, message="Title must not exceed 255 characters")
    private String title;
    private String description;
    private Priority priority;
    // Optional status – parsed strictly by the module (PENDING / ACTIVE / COMPLETED)
    private String status;
    // Optional tag names – used for creating/updating tags per user
    private Set<@NotBlank(message="Tag name must not be blank") @Size(max=50, message="Tag name must not exceed 50 characters") String> tagNames;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    // Optional reminder timestamp (ISO-8601); parsed strictly by the module.
    private String reminderAt;
    // Optional recurrence rule (NONE|DAILY|WEEKLY|MONTHLY); parsed by the module.
    private String recurrence;

    public TaskRequest() {}

    public TaskRequest(String title, String description, Priority priority, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    // getters and setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Set<String> getTagNames() { return tagNames; }
    public void setTagNames(Set<String> tagNames) { this.tagNames = tagNames; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getReminderAt() { return reminderAt; }
    public void setReminderAt(String reminderAt) { this.reminderAt = reminderAt; }
    public String getRecurrence() { return recurrence; }
    public void setRecurrence(String recurrence) { this.recurrence = recurrence; }
}
