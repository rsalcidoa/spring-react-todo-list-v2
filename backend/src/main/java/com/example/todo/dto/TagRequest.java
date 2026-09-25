package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TagRequest {
    @NotBlank(message = "Name must not be blank")
    @Size(min = 1, max = 50)
    private String name;

    public TagRequest() {}

    public TagRequest(String name) {
        this.name = name;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
