package com.example.todo.exception;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void ownershipDeniedMapsTo403WithBody() {
        ResponseEntity<Map<String, String>> response = handler.handleOwnershipDenied(new OwnershipDeniedException());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Forbidden", response.getBody().get("error"));
    }

    @Test
    void resourceNotFoundMapsTo404WithBody() {
        ResponseEntity<Map<String, String>> response = handler.handleResourceNotFound(new ResourceNotFoundException());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Not found", response.getBody().get("error"));
    }

    @Test
    void unauthenticatedMapsTo401() {
        ResponseEntity<Void> response = handler.handleUnauthenticated(new UnauthenticatedException());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void userAlreadyExistsMapsTo409WithMessage() {
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, String>> response = handler.handleUserAlreadyExists(new UserAlreadyExistsException());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        Map<String, String> body = response.getBody();
        assertInstanceOf(Map.class, body);
        assertEquals("Este email ya está registrado", body.get("error"));
    }

    @Test
    void methodArgumentNotValidMapsTo400WithFieldErrors() {
        MethodArgumentNotValidException ex = Mockito.mock(MethodArgumentNotValidException.class);
        FieldError passwordError = Mockito.mock(FieldError.class);
        FieldError emailError = Mockito.mock(FieldError.class);
        Mockito.when(passwordError.getField()).thenReturn("password");
        Mockito.when(passwordError.getDefaultMessage()).thenReturn("Password must be at least 6 characters");
        Mockito.when(emailError.getField()).thenReturn("email");
        Mockito.when(emailError.getDefaultMessage()).thenReturn("Must be a valid email address");
        Mockito.when(ex.getFieldErrors()).thenReturn(List.of(passwordError, emailError));

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertInstanceOf(Map.class, body);
        assertEquals("Validation failed", body.get("error"));
        @SuppressWarnings("unchecked")
        Map<String, List<String>> errors = (Map<String, List<String>>) body.get("errors");
        assertTrue(errors.containsKey("password"));
        assertTrue(errors.containsKey("email"));
        assertEquals(List.of("Password must be at least 6 characters"), errors.get("password"));
        assertEquals(List.of("Must be a valid email address"), errors.get("email"));
    }

    @Test
    void elementPathsCollapseToTagNamesKey() {
        MethodArgumentNotValidException ex = Mockito.mock(MethodArgumentNotValidException.class);
        FieldError first = Mockito.mock(FieldError.class);
        FieldError second = Mockito.mock(FieldError.class);
        Mockito.when(first.getField()).thenReturn("tagNames[0]");
        Mockito.when(first.getDefaultMessage()).thenReturn("Tag name must not be blank");
        Mockito.when(second.getField()).thenReturn("tagNames[1]");
        Mockito.when(second.getDefaultMessage()).thenReturn("Tag name must not exceed 50 characters");
        Mockito.when(ex.getFieldErrors()).thenReturn(List.of(first, second));

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, List<String>> errors = (Map<String, List<String>>) response.getBody().get("errors");
        assertEquals(1, errors.size(), "Element paths must collapse to a single tagNames key");
        assertEquals(
                List.of("Tag name must not be blank", "Tag name must not exceed 50 characters"),
                errors.get("tagNames"));
    }

    @Test
    void invalidStatusValueMapsToStructured400() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleInvalidStatusValue(new InvalidStatusValueException("status", "Status must be PENDING, ACTIVE or COMPLETED"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation failed", response.getBody().get("error"));
        @SuppressWarnings("unchecked")
        Map<String, List<String>> errors = (Map<String, List<String>>) response.getBody().get("errors");
        assertEquals(List.of("Status must be PENDING, ACTIVE or COMPLETED"), errors.get("status"));
    }

    @Test
    void tagAlreadyExistsMapsTo409WithBody() {
        ResponseEntity<Map<String, String>> response = handler.handleTagAlreadyExists(new TagAlreadyExistsException());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Tag already exists", response.getBody().get("error"));
    }

    @Test
    void illegalArgumentMapsTo400WithMessage() {
        ResponseEntity<Map<String, String>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("Passwords do not match"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Passwords do not match", response.getBody().get("error"));
    }

    @Test
    void invalidResetTokenMapsTo401WithMessage() {
        ResponseEntity<Map<String, String>> response =
                handler.handleInvalidResetToken(new InvalidResetTokenException());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid reset token", response.getBody().get("error"));
    }

    @Test
    void expiredResetTokenMapsTo401WithMessage() {
        ResponseEntity<Map<String, String>> response =
                handler.handleResetTokenExpired(new ResetTokenExpiredException());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Reset token has expired", response.getBody().get("error"));
    }
}
