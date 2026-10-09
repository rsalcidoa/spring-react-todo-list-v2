package com.example.todo;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompletionApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    private String token;

    private void registerAndLogin() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isCreated());
        String login = mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        token = mapper.readTree(login).path("token").asText();
    }

    private long createTask(String json) throws Exception {
        MvcResult r = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString()).path("id").asLong();
    }

    private void setStatus(long id, String status) throws Exception {
        mockMvc.perform(patch("/v1/tasks/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"" + status + "\"}"))
                .andExpect(status().isOk());
    }

    private JsonNode getTask(long id) throws Exception {
        MvcResult r = mockMvc.perform(get("/v1/tasks/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void anUntouchedTaskHasNoCompletionTimestamp() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"T\", \"priority\": \"LOW\"}");
        assertFalse(getTask(id).hasNonNull("completedAt"));
    }

    @Test
    void completingSetsTheCompletionTimestamp() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"T\", \"priority\": \"LOW\"}");
        setStatus(id, "COMPLETED");
        assertTrue(getTask(id).hasNonNull("completedAt"));
    }

    @Test
    void reopeningClearsTheCompletionTimestamp() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"T\", \"priority\": \"LOW\"}");
        setStatus(id, "COMPLETED");
        assertTrue(getTask(id).hasNonNull("completedAt"));
        setStatus(id, "ACTIVE");
        assertFalse(getTask(id).hasNonNull("completedAt"));
    }

    @Test
    void resavingACompletedTaskKeepsTheTimestamp() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"T\", \"priority\": \"LOW\"}");
        setStatus(id, "COMPLETED");
        String first = getTask(id).path("completedAt").asText();

        mockMvc.perform(put("/v1/tasks/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T2\", \"priority\": \"LOW\"}"))
                .andExpect(status().isOk());

        assertTrue(getTask(id).hasNonNull("completedAt"));
        assertTrue(first.equals(getTask(id).path("completedAt").asText()));
    }
}
