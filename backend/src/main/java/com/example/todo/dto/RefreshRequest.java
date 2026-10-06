package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;

public class RefreshRequest {
    @NotBlank(message = "Refresh token must not be blank")
    private String refreshToken;

    public RefreshRequest() {}

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
