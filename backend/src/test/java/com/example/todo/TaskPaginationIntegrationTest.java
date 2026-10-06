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
class TaskPaginationIntegrationTest {

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
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/v1/tasks")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"title\": \"T" + i + "\", \"priority\": \"LOW\"}"))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void pagedEnvelopeAndPlainArray() throws Exception {
        registerAndLogin();

        mockMvc.perform(get("/v1/tasks?page=0&size=2").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.total").value(3));

        MvcResult all = mockMvc.perform(get("/v1/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(3, mapper.readTree(all.getResponse().getContentAsString()).size());
    }

    @Test
    void invalidPaginationRejected() throws Exception {
        registerAndLogin();
        mockMvc.perform(get("/v1/tasks?page=0&size=0").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.size[0]").exists());
    }
}
