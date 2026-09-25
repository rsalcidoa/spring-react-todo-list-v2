package com.example.todo.exception;

public class TagAlreadyExistsException extends RuntimeException {
    public TagAlreadyExistsException() {
        super("Tag already exists");
    }
}
