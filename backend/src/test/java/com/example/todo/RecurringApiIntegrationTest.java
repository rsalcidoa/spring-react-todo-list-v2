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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RecurringApiIntegrationTest {

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

    private void complete(long id) throws Exception {
        mockMvc.perform(patch("/v1/tasks/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"COMPLETED\"}"))
                .andExpect(status().isOk());
    }

    private JsonNode listAll() throws Exception {
        MvcResult r = mockMvc.perform(get("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void completingRecurringTaskCreatesNextOccurrenceOnce() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"Weekly\", \"priority\": \"LOW\", \"dueDate\": \"2026-01-01\", \"recurrence\": \"WEEKLY\"}");

        complete(id);

        JsonNode afterFirst = listAll();
        assertEquals(2, afterFirst.size(), "original + next occurrence");
        JsonNode child = null;
        for (JsonNode node : afterFirst) {
            if ("PENDING".equals(node.path("status").asText())) child = node;
        }
        assertTrue(child != null, "a PENDING next occurrence exists");
        assertEquals("2026-01-08", child.path("dueDate").asText());

        // Completing again must not create a duplicate.
        complete(id);
        assertEquals(2, listAll().size());
    }

    @Test
    void nonRecurringTaskDoesNotGenerate() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"OneOff\", \"priority\": \"LOW\", \"dueDate\": \"2026-01-01\"}");
        complete(id);
        assertEquals(1, listAll().size());
    }

    @Test
    void recurrenceWithoutDueDateRejected() throws Exception {
        registerAndLogin();
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Bad\", \"priority\": \"LOW\", \"recurrence\": \"DAILY\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.recurrence[0]").exists());
    }

    @Test
    void recurringReminderIsShifted() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"Weekly\", \"priority\": \"LOW\", \"dueDate\": \"2026-01-01\", \"recurrence\": \"WEEKLY\", \"reminderAt\": \"2026-01-01T09:00:00\"}");
        complete(id);

        JsonNode child = null;
        for (JsonNode node : listAll()) {
            if ("PENDING".equals(node.path("status").asText())) child = node;
        }
        assertTrue(child != null);
        assertEquals("2026-01-08", child.path("dueDate").asText());
        assertEquals("2026-01-08T09:00:00", child.path("reminderAt").asText());
    }

}
