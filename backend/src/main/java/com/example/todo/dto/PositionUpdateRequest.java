package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PositionUpdateRequest {
    @NotBlank(message = "Status must not be blank")
    private String status;

    @NotNull(message = "Position must not be null")
    private Double position;

    public PositionUpdateRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getPosition() { return position; }
    public void setPosition(Double position) { this.position = position; }
}
