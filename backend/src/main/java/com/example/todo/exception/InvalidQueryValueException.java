package com.example.todo.exception;

public class InvalidQueryValueException extends RuntimeException {
    private final String field;

    public InvalidQueryValueException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() { return field; }
}
