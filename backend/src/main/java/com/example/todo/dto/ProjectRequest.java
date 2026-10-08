package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProjectRequest {
    @NotBlank(message = "Name must not be blank")
    @Size(min = 1, max = 50)
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    public ProjectRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
