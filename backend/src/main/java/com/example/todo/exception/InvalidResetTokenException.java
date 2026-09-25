package com.example.todo.exception;

public class InvalidResetTokenException extends RuntimeException {
    public InvalidResetTokenException() {
        super("Invalid reset token");
    }

    public InvalidResetTokenException(String message) {
        super(message);
    }
}
