package com.example.todo.exception;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * The single place that maps a domain error to its HTTP status and response
 * body. Exception classes carry data; this table owns the observable contract
 * ({@code {error}} for simple errors, {@code {error, errors}} for validation,
 * with {@code tagNames[i]} element paths collapsed to a single key).
 */
public final class ErrorTaxonomy {

    private ErrorTaxonomy() {
    }

    public record Body(HttpStatus status, Map<String, Object> content) {
    }

    public static Body body(ErrorKind kind, String field, String message) {
        return switch (kind) {
            case UNAUTHENTICATED -> simple(HttpStatus.UNAUTHORIZED, "Authentication required");
            case FORBIDDEN -> simple(HttpStatus.FORBIDDEN, "Forbidden");
            case NOT_FOUND -> simple(HttpStatus.NOT_FOUND, "Not found");
            case TAG_ALREADY_EXISTS -> simple(HttpStatus.CONFLICT, "Tag already exists");
            case PROJECT_ALREADY_EXISTS -> simple(HttpStatus.CONFLICT, "Project already exists");
            case USER_ALREADY_EXISTS -> simple(HttpStatus.CONFLICT, "Este email ya está registrado");
            case AUTHENTICATION_FAILED -> simple(HttpStatus.UNAUTHORIZED, "Invalid email or password");
            case INVALID_TOKEN -> simple(HttpStatus.UNAUTHORIZED, message);
            case PASSWORD_MISMATCH -> simple(HttpStatus.BAD_REQUEST, message);
            case VALIDATION, INVALID_STATUS -> validation(HttpStatus.BAD_REQUEST, field, message);
        };
    }

    public static Map<String, String> errorBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", message);
        return body;
    }

    public static Map<String, Object> validationBody(Map<String, List<String>> errors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Validation failed");
        body.put("errors", errors);
        return body;
    }

    public static Map<String, Object> validationBody(String field, String message) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        errors.computeIfAbsent(normalizeField(field), k -> new ArrayList<>()).add(message);
        return validationBody(errors);
    }

    /** Collapses container-element paths (e.g. {@code tagNames[0]}) to their stable key. */
    public static String normalizeField(String field) {
        if (field != null && field.startsWith("tagNames[")) {
            return "tagNames";
        }
        return field;
    }

    @SuppressWarnings("unchecked")
    public static ResponseEntity<Map<String, String>> simpleResponse(ErrorKind kind) {
        Body body = body(kind, null, null);
        return ResponseEntity.status(body.status()).body((Map<String, String>) (Map<?, ?>) body.content());
    }

    public static ResponseEntity<Map<String, String>> messageResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(errorBody(message));
    }

    public static ResponseEntity<Map<String, Object>> validationResponse(ErrorKind kind, String field, String message) {
        Body body = body(kind, field, message);
        return ResponseEntity.status(body.status()).body(body.content());
    }

    public static ResponseEntity<Map<String, Object>> bodyResponse(ErrorKind kind, String field, String message) {
        Body body = body(kind, field, message);
        return ResponseEntity.status(body.status()).body(body.content());
    }

    private static Body simple(HttpStatus status, String message) {
        return new Body(status, new LinkedHashMap<>(errorBody(message)));
    }

    private static Body validation(HttpStatus status, String field, String message) {
        return new Body(status, validationBody(field, message));
    }
}
