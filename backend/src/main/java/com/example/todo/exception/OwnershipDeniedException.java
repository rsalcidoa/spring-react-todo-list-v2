package com.example.todo.exception;

public class OwnershipDeniedException extends RuntimeException {
    public OwnershipDeniedException() {
        super("Resource does not belong to the current user");
    }
}
