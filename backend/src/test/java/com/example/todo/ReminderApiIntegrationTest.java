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

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReminderApiIntegrationTest {

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

    @Test
    void dueReminderIsReturnedThenAcknowledged() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"Remind me\", \"priority\": \"LOW\", \"reminderAt\": \"2000-01-01T09:00:00\"}");

        String due = mockMvc.perform(get("/v1/tasks/reminders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(due).size());
        assertEquals(id, mapper.readTree(due).get(0).path("id").asLong());

        mockMvc.perform(post("/v1/tasks/" + id + "/reminder-ack")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        String after = mockMvc.perform(get("/v1/tasks/reminders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(0, mapper.readTree(after).size());
    }

    @Test
    void futureReminderIsNotDue() throws Exception {
        registerAndLogin();
        createTask("{\"title\": \"Later\", \"priority\": \"LOW\", \"reminderAt\": \"2999-01-01T09:00:00\"}");

        String due = mockMvc.perform(get("/v1/tasks/reminders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(0, mapper.readTree(due).size());
    }

    @Test
    void malformedReminderRejected() throws Exception {
        registerAndLogin();
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Bad\", \"priority\": \"LOW\", \"reminderAt\": \"not-a-time\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.reminderAt[0]").exists());
    }

    @Test
    void acknowledgeRespectsOwnership() throws Exception {
        registerAndLogin();
        long id = createTask("{\"title\": \"Mine\", \"priority\": \"LOW\", \"reminderAt\": \"2000-01-01T09:00:00\"}");

        // Second user attempts to ack
        String uuid = UUID.randomUUID().toString();
        String otherJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(otherJson))
                .andExpect(status().isCreated());
        String otherLogin = mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(otherJson))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String otherToken = mapper.readTree(otherLogin).path("token").asText();

        mockMvc.perform(post("/v1/tasks/" + id + "/reminder-ack")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }
}
