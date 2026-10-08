package com.example.todo.model;

import com.example.todo.exception.InvalidStatusValueException;

public enum TaskStatus {
    PENDING,
    ACTIVE,
    COMPLETED;

    /**
     * Parses a raw status value, translating an unknown value into the
     * structured 400 contract. Shared by the task, ordering and query paths so
     * the "status must be PENDING, ACTIVE or COMPLETED" rule lives once.
     */
    public static TaskStatus parse(String rawStatus) {
        try {
            return TaskStatus.valueOf(rawStatus);
        } catch (IllegalArgumentException e) {
            throw new InvalidStatusValueException("status", "Status must be PENDING, ACTIVE or COMPLETED");
        }
    }
}
