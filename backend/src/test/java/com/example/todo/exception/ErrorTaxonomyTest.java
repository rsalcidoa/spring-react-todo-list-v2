package com.example.todo.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ErrorTaxonomyTest {

    @SuppressWarnings("unchecked")
    private Map<String, List<String>> errorsOf(ErrorTaxonomy.Body body) {
        return (Map<String, List<String>>) body.content().get("errors");
    }

    @Test
    void forbiddenMapsTo403WithFixedBody() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.FORBIDDEN, null, null);
        assertEquals(HttpStatus.FORBIDDEN, body.status());
        assertEquals("Forbidden", body.content().get("error"));
    }

    @Test
    void notFoundMapsTo404WithFixedBody() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.NOT_FOUND, null, null);
        assertEquals(HttpStatus.NOT_FOUND, body.status());
        assertEquals("Not found", body.content().get("error"));
    }

    @Test
    void unauthenticatedMapsTo401WithFixedBody() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.UNAUTHENTICATED, null, null);
        assertEquals(HttpStatus.UNAUTHORIZED, body.status());
        assertEquals("Authentication required", body.content().get("error"));
    }

    @Test
    void authenticationFailedMapsTo401WithFixedBody() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.AUTHENTICATION_FAILED, null, null);
        assertEquals(HttpStatus.UNAUTHORIZED, body.status());
        assertEquals("Invalid email or password", body.content().get("error"));
    }

    @Test
    void conflictKindsMapTo409WithTheirFixedBodies() {
        assertEquals("Tag already exists", ErrorTaxonomy.body(ErrorKind.TAG_ALREADY_EXISTS, null, null).content().get("error"));
        assertEquals("Project already exists", ErrorTaxonomy.body(ErrorKind.PROJECT_ALREADY_EXISTS, null, null).content().get("error"));
        assertEquals("Este email ya está registrado", ErrorTaxonomy.body(ErrorKind.USER_ALREADY_EXISTS, null, null).content().get("error"));
        assertEquals(HttpStatus.CONFLICT, ErrorTaxonomy.body(ErrorKind.TAG_ALREADY_EXISTS, null, null).status());
    }

    @Test
    void invalidTokenCarriesItsMessageAt401() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.INVALID_TOKEN, null, "Reset token has expired");
        assertEquals(HttpStatus.UNAUTHORIZED, body.status());
        assertEquals("Reset token has expired", body.content().get("error"));
    }

    @Test
    void passwordMismatchCarriesItsMessageAt400() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(ErrorKind.PASSWORD_MISMATCH, null, "Passwords do not match");
        assertEquals(HttpStatus.BAD_REQUEST, body.status());
        assertEquals("Passwords do not match", body.content().get("error"));
    }

    @Test
    void validationMapsToStructured400() {
        ErrorTaxonomy.Body body = ErrorTaxonomy.body(
                ErrorKind.INVALID_STATUS, "status", "Status must be PENDING, ACTIVE or COMPLETED");

        assertEquals(HttpStatus.BAD_REQUEST, body.status());
        assertEquals("Validation failed", body.content().get("error"));
        assertEquals(List.of("Status must be PENDING, ACTIVE or COMPLETED"), errorsOf(body).get("status"));
    }

    @Test
    void normalizeFieldCollapsesTagNameElementPaths() {
        assertEquals("tagNames", ErrorTaxonomy.normalizeField("tagNames[0]"));
        assertEquals("tagNames", ErrorTaxonomy.normalizeField("tagNames[3]"));
        assertEquals("title", ErrorTaxonomy.normalizeField("title"));
    }

    @Test
    void domainExceptionCarriesKindFieldAndMessage() {
        DomainException ex = new DomainException(ErrorKind.PASSWORD_MISMATCH, "confirmPassword", "Passwords do not match");

        assertEquals(ErrorKind.PASSWORD_MISMATCH, ex.getKind());
        assertEquals("confirmPassword", ex.getField());
        assertEquals("Passwords do not match", ex.getMessage());
    }
}
