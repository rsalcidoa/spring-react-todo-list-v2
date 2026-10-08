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
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectApiIntegrationTest {

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

    private long createProject(String name) throws Exception {
        MvcResult r = mockMvc.perform(post("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString()).path("id").asLong();
    }

    private String newUserToken() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isCreated());
        String login = mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(login).path("token").asText();
    }

    @Test
    void projectCrudAndDuplicateRule() throws Exception {
        registerAndLogin();
        long id = createProject("Casa");

        mockMvc.perform(post("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \" casa \"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/v1/projects/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Hogar\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Hogar"));

        String list = mockMvc.perform(get("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(list).size());

        mockMvc.perform(delete("/v1/projects/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void taskAssignmentAndForeignProjectRejected() throws Exception {
        registerAndLogin();
        long projectId = createProject("Work");

        MvcResult task = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T\", \"priority\": \"LOW\", \"projectId\": " + projectId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(projectId))
                .andExpect(jsonPath("$.projectName").value("Work"))
                .andReturn();
        long taskId = mapper.readTree(task.getResponse().getContentAsString()).path("id").asLong();

        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Bad\", \"priority\": \"LOW\", \"projectId\": 999999}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.projectId[0]").exists());

        // Deleting the project unassigns it from the task.
        mockMvc.perform(delete("/v1/projects/" + projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/tasks/" + taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").doesNotExist());
    }

    @Test
    void projectDescriptionIsOptionalAndEchoed() throws Exception {
        registerAndLogin();

        MvcResult created = mockMvc.perform(post("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Casa\", \"description\": \"Remodelación de la cocina\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Remodelación de la cocina"))
                .andReturn();
        long id = mapper.readTree(created.getResponse().getContentAsString()).path("id").asLong();

        mockMvc.perform(get("/v1/projects").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("Remodelación de la cocina"));

        mockMvc.perform(put("/v1/projects/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Casa\", \"description\": \"Nueva descripción\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Nueva descripción"));

        mockMvc.perform(post("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"SinDesc\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value(nullValue()));

        String longDescription = "x".repeat(501);
        mockMvc.perform(post("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Grande\", \"description\": \"" + longDescription + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.description[0]").exists());
    }

    @Test
    void crossUserProjectAccessForbidden() throws Exception {
        registerAndLogin();
        long projectId = createProject("Mine");
        String otherToken = newUserToken();

        mockMvc.perform(put("/v1/projects/" + projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Hacked\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/v1/projects/" + projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        // The other user only sees their own projects.
        String otherList = mockMvc.perform(get("/v1/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(0, mapper.readTree(otherList).size());
    }
}
