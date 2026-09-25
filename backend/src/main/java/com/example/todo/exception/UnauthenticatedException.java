package com.example.todo.exception;

public class UnauthenticatedException extends RuntimeException {
    public UnauthenticatedException() {
        super("No authenticated user");
    }
}
