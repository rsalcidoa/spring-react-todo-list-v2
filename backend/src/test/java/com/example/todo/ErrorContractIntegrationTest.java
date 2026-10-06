package com.example.todo;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ErrorContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void duplicateEmailReturns409WithMessage() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        // Register user A
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        // Re-register same user -> 409 with structured body
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Este email ya está registrado"));
    }

    @Test
    void shortPasswordReturns400WithFieldError() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"123\"}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.password[0]").value("Password must be at least 6 characters"));
    }

    @Test
    void invalidEmailReturns400WithFieldError() throws Exception {
        String userJson = "{\"email\": \"invalid\", \"password\": \"secret123\"}";

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email[0]").value("Must be a valid email address"));
    }

    @Test
    void loginWithEmptyEmailReturns400WithFieldError() throws Exception {
        String userJson = "{\"email\": \"\", \"password\": \"secret123\"}";

        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email[0]").value("Email must not be blank"));
    }

    @Test
    void registerReturnsEmailOnlyWithoutPassword() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(uuid + "@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void loginWithWrongPasswordReturns401WithMessage() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String badLogin = String.format("{\"email\": \"%s\", \"password\": \"wrongpass1\"}", email);
        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(badLogin))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void createTaskWithDueDateReturns201AndEchoesDate() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        // Register and login
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = mapper.readTree(loginResp).path("token").asText();
        assertNotNull(token);

        // Create task with dueDate
        String taskJson = "{\"title\": \"Task with due date\", \"description\": \"Test\", \"priority\": \"LOW\", \"dueDate\": \"2024-12-31\"}";
        String response = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode task = mapper.readTree(response);
        assertEquals("2024-12-31", task.path("dueDate").asText());
    }

    @Test
    void registerWithNullPasswordReturns400WithFieldError() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": null}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.password[0]").value("Password must not be blank"));
    }

    @Test
    void patchStatusWithNullBodyReturns400() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(patch("/v1/tasks/{id}/status", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.status[0]").value("Status must not be blank"));
    }

    @Test
    void patchStatusWithBlankStatusReturns400WithFieldError() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(patch("/v1/tasks/{id}/status", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.status[0]").value("Status must not be blank"));
    }

    @Test
    void patchStatusWithInvalidValueReturns400() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(patch("/v1/tasks/{id}/status", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"INVALID\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.status[0]").value("Status must be PENDING, ACTIVE or COMPLETED"));
    }

    @Test
    void putTaskWithInvalidStatusReturns400WithFieldError() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/v1/tasks/{id}", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Updated\", \"description\": \"Test\", \"priority\": \"LOW\", \"status\": \"INVALID\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.status[0]").value("Status must be PENDING, ACTIVE or COMPLETED"));
    }

    @Test
    void patchStatusWithValidValueReturns200() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(patch("/v1/tasks/{id}/status", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    private String token;

    private String createTaskAndId() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        token = mapper.readTree(loginResp).path("token").asText();

        String taskJson = "{\"title\": \"Patch status task\", \"description\": \"Test\", \"priority\": \"LOW\"}";
        String response = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return mapper.readTree(response).path("id").asText();
    }

    @Test
    void invalidStatusQueryReturnsStructured400() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = mapper.readTree(loginResp).path("token").asText();

        mockMvc.perform(get("/v1/tasks?status=INVALID")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.status[0]").value("Status must be PENDING, ACTIVE or COMPLETED"));
    }

    @Test
    void registerWithEmptyEmailReturns400WithFieldError() throws Exception {
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"\", \"password\": \"secret123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email[0]").value("Email must not be blank"));
    }

    @Test
    void createTaskWithBlankTitleReturns400AndCreatesNothing() throws Exception {
        createTaskAndId();

        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"   \", \"priority\": \"LOW\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.title[0]").value("Title must not be blank"));

        String listBody = mockMvc.perform(get("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(listBody).size(), "No task may be created on validation failure");
    }

    @Test
    void updateTaskWithNullTitleReturns400AndDoesNotModify() throws Exception {
        String taskId = createTaskAndId();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/v1/tasks/{id}", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": null, \"priority\": \"LOW\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.title[0]").value("Title must not be blank"));

        String taskBody = mockMvc.perform(get("/v1/tasks/{id}", taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("Patch status task", mapper.readTree(taskBody).path("title").asText(),
                "Task title must be unchanged after a rejected update");
    }
}
