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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TaskQueryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    private String token;

    private String registerAndLogin() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isCreated());
        String login = mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(userJson))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        token = mapper.readTree(login).path("token").asText();
        return token;
    }

    private void createTask(String json) throws Exception {
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated());
    }

    private JsonNode list(String query) throws Exception {
        MvcResult r = mockMvc.perform(get("/v1/tasks" + query)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void searchByTextMatchesTitleOrDescription() throws Exception {
        registerAndLogin();
        createTask("{\"title\": \"Informe mensual\", \"priority\": \"LOW\"}");
        createTask("{\"title\": \"Comprar leche\", \"description\": \"informe de compra\", \"priority\": \"LOW\"}");
        createTask("{\"title\": \"Otra cosa\", \"priority\": \"LOW\"}");

        JsonNode result = list("?q=informe");

        assertEquals(2, result.size(), "title and description matches");
    }

    @Test
    void filterByPriorityAndTags() throws Exception {
        registerAndLogin();
        String tagResp = mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long tagId = mapper.readTree(tagResp).path("id").asLong();

        createTask("{\"title\": \"High\", \"priority\": \"HIGH\", \"tagNames\": [\"Work\"]}");
        createTask("{\"title\": \"Low\", \"priority\": \"LOW\"}");

        assertEquals(1, list("?priority=HIGH").size());
        assertEquals("High", list("?priority=HIGH").get(0).path("title").asText());

        JsonNode byTag = list("?tagIds=" + tagId);
        assertEquals(1, byTag.size());
        assertEquals("High", byTag.get(0).path("title").asText());
    }

    @Test
    void sortByDueDateAscendingPlacesNullsLast() throws Exception {
        registerAndLogin();
        createTask("{\"title\": \"Later\", \"priority\": \"LOW\", \"dueDate\": \"2026-03-01\"}");
        createTask("{\"title\": \"Sooner\", \"priority\": \"LOW\", \"dueDate\": \"2026-01-01\"}");
        createTask("{\"title\": \"NoDate\", \"priority\": \"LOW\"}");

        JsonNode result = list("?sort=dueDate&dir=asc");

        assertEquals(3, result.size());
        assertEquals("Sooner", result.get(0).path("title").asText());
        assertEquals("Later", result.get(1).path("title").asText());
        assertEquals("NoDate", result.get(2).path("title").asText());
    }

    @Test
    void invalidSortReturnsStructured400() throws Exception {
        registerAndLogin();
        mockMvc.perform(get("/v1/tasks?sort=bogus")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.sort[0]").exists());
    }

    @Test
    void invalidPriorityReturnsStructured400() throws Exception {
        registerAndLogin();
        mockMvc.perform(get("/v1/tasks?priority=URGENT")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.priority[0]").exists());
    }
}
