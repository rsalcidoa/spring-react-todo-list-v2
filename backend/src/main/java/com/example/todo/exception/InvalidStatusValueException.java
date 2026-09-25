package com.example.todo.exception;

public class InvalidStatusValueException extends RuntimeException {
    private final String field;

    public InvalidStatusValueException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() { return field; }
}
