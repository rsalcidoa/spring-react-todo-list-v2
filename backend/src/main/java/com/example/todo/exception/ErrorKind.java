package com.example.todo.exception;

/** The domain error kinds the API can express. */
public enum ErrorKind {
    UNAUTHENTICATED,
    FORBIDDEN,
    NOT_FOUND,
    TAG_ALREADY_EXISTS,
    PROJECT_ALREADY_EXISTS,
    USER_ALREADY_EXISTS,
    AUTHENTICATION_FAILED,
    INVALID_TOKEN,
    PASSWORD_MISMATCH,
    VALIDATION,
    INVALID_STATUS
}
