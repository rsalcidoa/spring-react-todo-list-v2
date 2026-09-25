package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;

public class ResetVerifyDto {
    @NotBlank(message = "Token must not be blank")
    private String token;

    public ResetVerifyDto() {}

    public ResetVerifyDto(String token) {
        this.token = token;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
