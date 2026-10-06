package com.example.todo;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    private String registerUser(String email, String password) throws Exception {
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"%s\"}", email, password);
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());
        return userJson;
    }

    private String requestResetToken(String email) throws Exception {
        String reqJson = String.format("{\"email\": \"%s\"}", email);
        String resp = mockMvc.perform(post("/v1/auth/reset-request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reqJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return mapper.readTree(resp).path("token").asText();
    }

    @Test
    void resetRequestWithValidEmailReturnsToken() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");

        String token = requestResetToken(email);

        assertNotNull(token);
        assertFalse(token.isEmpty(), "token should not be empty for registered email");
        assertEquals(6, token.length());
    }

    @Test
    void resetRequestWithUnknownEmailReturnsEmptyToken() throws Exception {
        String reqJson = "{\"email\": \"nobody-" + UUID.randomUUID() + "@example.com\"}";

        String resp = mockMvc.perform(post("/v1/auth/reset-request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reqJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = mapper.readTree(resp);
        assertEquals("", node.path("token").asText(), "unknown email must return empty token silently");
    }

    @Test
    void resetRequestWithInvalidEmailFormatReturns400() throws Exception {
        String reqJson = "{\"email\": \"notanemail\"}";

        mockMvc.perform(post("/v1/auth/reset-request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email[0]").value("Must be a valid email address"));
    }

    @Test
    void resetVerifyWithValidTokenReturns200() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");
        String token = requestResetToken(email);

        String verifyJson = String.format("{\"token\": \"%s\"}", token);
        mockMvc.perform(post("/v1/auth/reset-verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(verifyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void resetVerifyWithInvalidTokenReturns401() throws Exception {
        String verifyJson = "{\"token\": \"NOPE99\"}";

        mockMvc.perform(post("/v1/auth/reset-verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(verifyJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid reset token"));
    }

    @Test
    void resetChangeWithValidTokenUpdatesPassword() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");
        String token = requestResetToken(email);

        String changeJson = String.format("{\"token\": \"%s\", \"newPassword\": \"newpass9\", \"confirmPassword\": \"newpass9\"}", token);
        mockMvc.perform(put("/v1/auth/reset-change")
                .contentType(MediaType.APPLICATION_JSON)
                .content(changeJson))
                .andExpect(status().isOk());

        // Old password no longer works
        String oldLogin = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);
        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(oldLogin))
                .andExpect(status().isUnauthorized());

        // New password works
        String newLogin = String.format("{\"email\": \"%s\", \"password\": \"newpass9\"}", email);
        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(newLogin))
                .andExpect(status().isOk());
    }

    @Test
    void resetChangeWithMismatchedConfirmationReturns400() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");
        String token = requestResetToken(email);

        String changeJson = String.format("{\"token\": \"%s\", \"newPassword\": \"newpass9\", \"confirmPassword\": \"different\"}", token);
        mockMvc.perform(put("/v1/auth/reset-change")
                .contentType(MediaType.APPLICATION_JSON)
                .content(changeJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Passwords do not match"));
    }

    @Test
    void resetChangeWithShortPasswordReturns400() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");
        String token = requestResetToken(email);

        String changeJson = String.format("{\"token\": \"%s\", \"newPassword\": \"abc\", \"confirmPassword\": \"abc\"}", token);
        mockMvc.perform(put("/v1/auth/reset-change")
                .contentType(MediaType.APPLICATION_JSON)
                .content(changeJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.newPassword[0]").value("Password must be at least 6 characters"));
    }

    @Test
    void resetChangeWithInvalidTokenReturns401() throws Exception {
        String changeJson = "{\"token\": \"NOPE99\", \"newPassword\": \"newpass9\", \"confirmPassword\": \"newpass9\"}";

        mockMvc.perform(put("/v1/auth/reset-change")
                .contentType(MediaType.APPLICATION_JSON)
                .content(changeJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid reset token"));
    }

    @Test
    void loginWithShortNonBlankPasswordReachesAuthenticationAndReturns401() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        registerUser(email, "secret123");

        // Login carries no @Size minimum: a short but non-blank password passes
        // validation and fails later as an authentication error (401, not 400).
        String shortLogin = String.format("{\"email\": \"%s\", \"password\": \"abc\"}", email);
        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(shortLogin))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }
}
