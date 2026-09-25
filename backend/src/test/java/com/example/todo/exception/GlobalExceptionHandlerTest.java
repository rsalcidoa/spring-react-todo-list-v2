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
    void ownershipDeniedMapsTo403() {
        ResponseEntity<Void> response = handler.handleOwnershipDenied(new OwnershipDeniedException());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void resourceNotFoundMapsTo404() {
        ResponseEntity<Void> response = handler.handleResourceNotFound(new ResourceNotFoundException());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
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
        Mockito.when(passwordError.getDefaultMessage()).thenReturn("Password must be at least 6 characters long");
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
        assertEquals(List.of("Password must be at least 6 characters long"), errors.get("password"));
        assertEquals(List.of("Must be a valid email address"), errors.get("email"));
    }
}
