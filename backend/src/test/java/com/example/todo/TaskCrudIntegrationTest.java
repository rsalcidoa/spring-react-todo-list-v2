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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TaskCrudIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void crud_flow() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userEmail = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", userEmail);

        // Register
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        // Login and capture token
        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = mapper.readTree(loginResp).path("token").asText();
        assertNotNull(token, "Token should be present in login response");

        // Create a task with status and tags
        String taskJson = "{\"title\": \"Test Task\", \"description\": \"Demo description\", \"priority\": \"MEDIUM\", \"status\": \"PENDING\", \"tagNames\": [\"Work\"]}";
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer "+token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson))
                .andExpect(status().isCreated());

        // List tasks and verify the created one appears
        mockMvc.perform(get("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer "+token))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    // Expect at least one element with title 'Test Task'
                    boolean found = mapper.readTree(body).elements()
                            .hasNext() &&
                            "Test Task".equals(mapper.readTree(body).elements().next().path("title").asText());
                    assertTrue(found, "Created task should appear in list");
                });
    }

    @Test
    void statusQueryFiltersAndAbsentParamReturnsAll() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userEmail = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", userEmail);

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

        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Pending one\", \"priority\": \"LOW\", \"status\": \"PENDING\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Active one\", \"priority\": \"LOW\", \"status\": \"ACTIVE\"}"))
                .andExpect(status().isCreated());

        String filtered = mockMvc.perform(get("/v1/tasks?status=PENDING")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var filteredNodes = mapper.readTree(filtered);
        assertEquals(1, filteredNodes.size());
        assertEquals("Pending one", filteredNodes.get(0).path("title").asText());

        String all = mockMvc.perform(get("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(2, mapper.readTree(all).size());
    }

    @Test
    void createWithoutStatusDefaultsToPendingAndExplicitStatusIsEchoed() throws Exception {
        String token = newUserToken();

        String defaultBody = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"No status\", \"priority\": \"LOW\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertEquals("PENDING", mapper.readTree(defaultBody).path("status").asText());

        String explicitBody = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Explicit\", \"priority\": \"LOW\", \"status\": \"ACTIVE\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertEquals("ACTIVE", mapper.readTree(explicitBody).path("status").asText());
    }

    @Test
    void filtersByActiveAndCompletedStatus() throws Exception {
        String token = newUserToken();
        createTask(token, "{\"title\": \"Active one\", \"priority\": \"LOW\", \"status\": \"ACTIVE\"}");
        createTask(token, "{\"title\": \"Done one\", \"priority\": \"LOW\", \"status\": \"COMPLETED\"}");
        createTask(token, "{\"title\": \"Pending one\", \"priority\": \"LOW\"}");

        String active = mockMvc.perform(get("/v1/tasks?status=ACTIVE")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(active).size());
        assertEquals("Active one", mapper.readTree(active).get(0).path("title").asText());

        String completed = mockMvc.perform(get("/v1/tasks?status=COMPLETED")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(1, mapper.readTree(completed).size());
        assertEquals("Done one", mapper.readTree(completed).get(0).path("title").asText());
    }

    @Test
    void updateStatusTransitionsAndOmittingStatusLeavesItUnchanged() throws Exception {
        String token = newUserToken();
        String id = createTask(token, "{\"title\": \"T\", \"priority\": \"LOW\"}");

        String toActive = mockMvc.perform(put("/v1/tasks/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T\", \"priority\": \"LOW\", \"status\": \"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("ACTIVE", mapper.readTree(toActive).path("status").asText());

        String toCompleted = mockMvc.perform(put("/v1/tasks/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T\", \"priority\": \"LOW\", \"status\": \"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("COMPLETED", mapper.readTree(toCompleted).path("status").asText());

        String withoutStatus = mockMvc.perform(put("/v1/tasks/" + id)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"T\", \"priority\": \"LOW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals("COMPLETED", mapper.readTree(withoutStatus).path("status").asText());
    }

    @Test
    void highPriorityIsStoredAndReturned() throws Exception {
        String token = newUserToken();

        String body = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Urgent\", \"priority\": \"HIGH\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertEquals("HIGH", mapper.readTree(body).path("priority").asText());
    }

    private String newUserToken() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", uuid + "@example.com");

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(loginResp).path("token").asText();
    }

    private String createTask(String token, String json) throws Exception {
        MvcResult result = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).path("id").asText();
    }
}

