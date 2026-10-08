package com.example.todo.exception;

/**
 * A domain error carrying data only: which {@link ErrorKind} it is, the field
 * it concerns (for validation-shaped kinds) and its message. The status and
 * response body are decided once by {@link ErrorTaxonomy}.
 */
public class DomainException extends RuntimeException {
    private final ErrorKind kind;
    private final String field;

    public DomainException(ErrorKind kind, String field, String message) {
        super(message);
        this.kind = kind;
        this.field = field;
    }

    public ErrorKind getKind() {
        return kind;
    }

    public String getField() {
        return field;
    }
}
