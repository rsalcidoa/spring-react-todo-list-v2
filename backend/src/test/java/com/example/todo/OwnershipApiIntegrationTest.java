package com.example.todo;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OwnershipApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    private String tokenA;
    private String tokenB;
    private long taskIdA;
    private long tagIdA;

    @BeforeEach
    void setUp() throws Exception {
        String uuid = UUID.randomUUID().toString();
        tokenA = registerAndLogin(uuid + "-a@example.com");
        tokenB = registerAndLogin(uuid + "-b@example.com");

        // User A creates a task T1 and captures its id.
        String createTaskResp = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"A Task\", \"description\": \"owned by A\", \"priority\": \"MEDIUM\", \"status\": \"PENDING\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        taskIdA = mapper.readTree(createTaskResp).path("id").asLong();

        // User A creates a tag G and captures its id.
        String createTagResp = mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"AGroup\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        tagIdA = mapper.readTree(createTagResp).path("id").asLong();
    }

    private String registerAndLogin(String email) throws Exception {
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
        assertNotNull(token, "Token should be present in login response");
        return token;
    }

    @Test
    void ownTaskOperationsSucceed() throws Exception {
        // A GET own task -> 200
        mockMvc.perform(get("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk());

        // A PATCH status own task -> 200
        mockMvc.perform(patch("/v1/tasks/{id}/status", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\"}"))
                .andExpect(status().isOk());

        // A PUT own task -> 200
        mockMvc.perform(put("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"A Task updated\", \"description\": \"owned by A\", \"priority\": \"MEDIUM\", \"status\": \"ACTIVE\"}"))
                .andExpect(status().isOk());

        // A DELETE own task -> 204
        mockMvc.perform(delete("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    @Test
    void crossUserTaskOperationsForbidden() throws Exception {
        // B GET task of A -> 403
        mockMvc.perform(get("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // B PUT task of A -> 403
        mockMvc.perform(put("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"hijack\", \"description\": \"x\", \"priority\": \"MEDIUM\", \"status\": \"PENDING\"}"))
                .andExpect(status().isForbidden());

        // B PATCH status task of A -> 403
        mockMvc.perform(patch("/v1/tasks/{id}/status", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\"}"))
                .andExpect(status().isForbidden());

        // B DELETE task of A -> 403
        mockMvc.perform(delete("/v1/tasks/{id}", taskIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonExistentTaskReturns404() throws Exception {
        long missing = 9_999_999L;

        // GET id inexistente -> 404
        mockMvc.perform(get("/v1/tasks/{id}", missing)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        // PUT id inexistente -> 404
        mockMvc.perform(put("/v1/tasks/{id}", missing)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"x\", \"description\": \"x\", \"priority\": \"MEDIUM\", \"status\": \"PENDING\"}"))
                .andExpect(status().isNotFound());

        // DELETE id inexistente -> 404
        mockMvc.perform(delete("/v1/tasks/{id}", missing)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        // PATCH status id inexistente -> 404
        mockMvc.perform(patch("/v1/tasks/{id}/status", missing)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void crossUserTagDeleteForbidden() throws Exception {
        // B DELETE tag of A -> 403
        mockMvc.perform(delete("/v1/tags/{id}", tagIdA)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonExistentTagDeleteReturns404() throws Exception {
        long missing = 9_999_999L;
        // DELETE tag inexistente -> 404
        mockMvc.perform(delete("/v1/tags/{id}", missing)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    void unauthenticatedReturns401() throws Exception {
        // GET task sin token -> 401
        mockMvc.perform(get("/v1/tasks/{id}", taskIdA))
                .andExpect(status().isUnauthorized());

        // DELETE tag sin token -> 401
        mockMvc.perform(delete("/v1/tags/{id}", tagIdA))
                .andExpect(status().isUnauthorized());
    }
}
