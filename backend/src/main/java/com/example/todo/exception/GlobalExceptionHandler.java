package com.example.todo.exception;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OwnershipDeniedException.class)
    public ResponseEntity<Map<String, String>> handleOwnershipDenied(OwnershipDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody("Forbidden"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Not found"));
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthenticated(UnauthenticatedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody("Authentication required"));
    }

    @ExceptionHandler(InvalidStatusValueException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStatusValue(InvalidStatusValueException ex) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        errors.computeIfAbsent(ex.getField(), k -> new java.util.ArrayList<>()).add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationBody(errors));
    }

    @ExceptionHandler(InvalidQueryValueException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidQueryValue(InvalidQueryValueException ex) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        errors.computeIfAbsent(ex.getField(), k -> new java.util.ArrayList<>()).add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationBody(errors));
    }

    @ExceptionHandler(TagAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleTagAlreadyExists(TagAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody("Tag already exists"));
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", "Este email ya está registrado");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        for (var fieldError : ex.getFieldErrors()) {
            errors.computeIfAbsent(normalizeField(fieldError.getField()), k -> new java.util.ArrayList<>()).add(fieldError.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationBody(errors));
    }

    // Single error-body builders for the whole seam (see password-reset REQ-PR-003).
    private Map<String, String> errorBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", message);
        return body;
    }

    private Map<String, Object> validationBody(Map<String, List<String>> errors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Validation failed");
        body.put("errors", errors);
        return body;
    }

    // Container-element violations arrive as tagNames[0], tagNames[1], ...;
    // collapse them to the stable tagNames key (see REQ-BV-003).
    private String normalizeField(String field) {
        if (field.startsWith("tagNames[")) {
            return "tagNames";
        }
        return field;
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(org.springframework.security.core.AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody("Invalid email or password"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(ex.getMessage()));
    }

    @ExceptionHandler(InvalidResetTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidResetToken(InvalidResetTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(ex.getMessage()));
    }

    @ExceptionHandler(ResetTokenExpiredException.class)
    public ResponseEntity<Map<String, String>> handleResetTokenExpired(ResetTokenExpiredException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(ex.getMessage()));
    }
}
