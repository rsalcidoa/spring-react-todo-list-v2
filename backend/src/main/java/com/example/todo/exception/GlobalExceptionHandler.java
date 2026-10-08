package com.example.todo.exception;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Thin adapter from typed exceptions to the {@link ErrorTaxonomy} contract. The
 * status + body of each error are decided once in the taxonomy, not here.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OwnershipDeniedException.class)
    public ResponseEntity<Map<String, String>> handleOwnershipDenied(OwnershipDeniedException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.FORBIDDEN);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.NOT_FOUND);
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthenticated(UnauthenticatedException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.UNAUTHENTICATED);
    }

    @ExceptionHandler(InvalidStatusValueException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStatusValue(InvalidStatusValueException ex) {
        return ErrorTaxonomy.validationResponse(ErrorKind.INVALID_STATUS, ex.getField(), ex.getMessage());
    }

    @ExceptionHandler(InvalidQueryValueException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidQueryValue(InvalidQueryValueException ex) {
        return ErrorTaxonomy.validationResponse(ErrorKind.VALIDATION, ex.getField(), ex.getMessage());
    }

    @ExceptionHandler(TagAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleTagAlreadyExists(TagAlreadyExistsException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.TAG_ALREADY_EXISTS);
    }

    @ExceptionHandler(ProjectAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleProjectAlreadyExists(ProjectAlreadyExistsException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.PROJECT_ALREADY_EXISTS);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.USER_ALREADY_EXISTS);
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<Map<String, Object>> handleDomainException(DomainException ex) {
        return ErrorTaxonomy.bodyResponse(ex.getKind(), ex.getField(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        for (var fieldError : ex.getFieldErrors()) {
            errors.computeIfAbsent(ErrorTaxonomy.normalizeField(fieldError.getField()), k -> new java.util.ArrayList<>())
                    .add(fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ErrorTaxonomy.validationBody(errors));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(org.springframework.security.core.AuthenticationException ex) {
        return ErrorTaxonomy.simpleResponse(ErrorKind.AUTHENTICATION_FAILED);
    }

    @ExceptionHandler(InvalidResetTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidResetToken(InvalidResetTokenException ex) {
        return ErrorTaxonomy.messageResponse(org.springframework.http.HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ErrorTaxonomy.messageResponse(org.springframework.http.HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(ResetTokenExpiredException.class)
    public ResponseEntity<Map<String, String>> handleResetTokenExpired(ResetTokenExpiredException ex) {
        return ErrorTaxonomy.messageResponse(org.springframework.http.HttpStatus.UNAUTHORIZED, ex.getMessage());
    }
}
