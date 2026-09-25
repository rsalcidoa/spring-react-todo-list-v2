package com.example.todo.exception;

public class ResetTokenExpiredException extends RuntimeException {
    public ResetTokenExpiredException() {
        super("Reset token has expired");
    }

    public ResetTokenExpiredException(String message) {
        super(message);
    }
}
