package com.example.todo.exception;

public class ProjectAlreadyExistsException extends RuntimeException {
    public ProjectAlreadyExistsException() {
        super("Project already exists");
    }
}
