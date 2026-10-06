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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SubtaskApiIntegrationTest {

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
    void subtasksAreHiddenFromTheBoardAndTrackProgressAndCascade() throws Exception {
        registerAndLogin();
        long parent = createTask("{\"title\": \"Parent\", \"priority\": \"LOW\"}");
        long child = createTask("{\"title\": \"Child\", \"priority\": \"LOW\", \"parentId\": " + parent + "}");

        // Subtask hidden from board listing
        String list = mockMvc.perform(get("/v1/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(list).size());

        // Fetch subtasks
        mockMvc.perform(get("/v1/tasks/" + parent + "/subtasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Progress reflects the child
        mockMvc.perform(get("/v1/tasks/" + parent).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtaskProgress.total").value(1))
                .andExpect(jsonPath("$.subtaskProgress.done").value(0));

        mockMvc.perform(patch("/v1/tasks/" + child + "/status")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"COMPLETED\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/tasks/" + parent).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtaskProgress.done").value(1));

        // Deleting the parent cascades to the child
        mockMvc.perform(delete("/v1/tasks/" + parent).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/v1/tasks/" + child).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void nestedSubtaskRejected() throws Exception {
        registerAndLogin();
        long parent = createTask("{\"title\": \"Parent\", \"priority\": \"LOW\"}");
        long child = createTask("{\"title\": \"Child\", \"priority\": \"LOW\", \"parentId\": " + parent + "}");

        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Grand\", \"priority\": \"LOW\", \"parentId\": " + child + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.parentId[0]").exists());
    }
}
