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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TaskOrderingApiIntegrationTest {

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

    private long createTask() throws Exception {
        MvcResult r = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T\", \"priority\": \"LOW\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString()).path("id").asLong();
    }

    @Test
    void reorderSetsStatusAndPosition() throws Exception {
        registerAndLogin();
        long id = createTask();

        mockMvc.perform(patch("/v1/tasks/" + id + "/position")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"ACTIVE\", \"position\": 5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.position").value(5.0));
    }

    @Test
    void invalidStatusRejected() throws Exception {
        registerAndLogin();
        long id = createTask();

        mockMvc.perform(patch("/v1/tasks/" + id + "/position")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"NOPE\", \"position\": 1}"))
                .andExpect(status().isBadRequest());
    }
}
