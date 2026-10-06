package com.example.todo;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TagApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    private String token;
    private String userJson;

    @BeforeEach
    void setUp() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String email = uuid + "@example.com";
        userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", email);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        String loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        token = mapper.readTree(loginResp).path("token").asText();
        assertNotNull(token);
    }

    @Test
    void createTagTrimsNameAndReturns201() throws Exception {
        String response = mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \" Personal \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Personal"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode tag = mapper.readTree(response);
        assertNotNull(tag.path("id"));
        assertEquals("Personal", tag.path("name").asText());
    }

    @Test
    void createTagCaseInsensitiveDuplicateReturns409AndNoNewRow() throws Exception {
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"work\"}"))
                .andExpect(status().isConflict());

        String listBody = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode tags = mapper.readTree(listBody);
        assertEquals(1, tags.size());
    }

    @Test
    void listTagsReturnsOnlyIdAndName() throws Exception {
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertFalse(body.contains("password"));
        JsonNode tags = mapper.readTree(body);
        assertTrue(tags.isArray());
        for (JsonNode tag : tags) {
            assertEquals(2, tag.size());
            assertNotNull(tag.path("id"));
            assertNotNull(tag.path("name"));
            assertFalse(tag.has("user"));
        }
    }

    @Test
    void concurrentCreateOfSameTagReturnsOne201AndOne409() throws Exception {
        String name = "Race" + UUID.randomUUID().toString().substring(0, 8);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                final String body = "{\"name\": \"" + name + "\"}";
                futures.add(executor.submit(() -> mockMvc.perform(post("/v1/tags")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                        .andReturn()
                        .getResponse().getStatus()));
            }
            List<Integer> codes = new ArrayList<>();
            for (Future<Integer> f : futures) {
                codes.add(f.get());
            }
            assertTrue(codes.contains(201));
            assertTrue(codes.contains(409));
        } finally {
            executor.shutdown();
        }

        String listBody = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertEquals(1, mapper.readTree(listBody).size());
    }

    @Test
    void createTagWithBlankNameReturns400WithFieldError() throws Exception {
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name[0]").exists());
    }

    @Test
    void createTagWithOversizedNameReturns400WithFieldError() throws Exception {
        String longName = "x".repeat(51);
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"" + longName + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name[0]").exists());
    }

    @Test
    void deleteTagReturns204AndUnassignsFromTasks() throws Exception {
        String tagResp = mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long tagId = mapper.readTree(tagResp).path("id").asLong();

        String taskResp = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Tagged\", \"priority\": \"LOW\", \"tagNames\": [\"Work\"]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long taskId = mapper.readTree(taskResp).path("id").asLong();
        assertEquals(1, mapper.readTree(taskResp).path("tags").size());

        mockMvc.perform(delete("/v1/tags/" + tagId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        String taskAfter = mockMvc.perform(get("/v1/tasks/" + taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(0, mapper.readTree(taskAfter).path("tags").size(), "Tag must be unassigned from the task");
        assertEquals("Tagged", mapper.readTree(taskAfter).path("title").asText(), "Task must remain");
    }

    @Test
    void listTagsIsScopedToTheAuthenticatedUser() throws Exception {
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"OnlyMine\"}"))
                .andExpect(status().isCreated());

        String otherUuid = UUID.randomUUID().toString();
        String otherJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", otherUuid + "@example.com");
        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(otherJson))
                .andExpect(status().isCreated());
        String otherLogin = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(otherJson))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String otherToken = mapper.readTree(otherLogin).path("token").asText();

        String otherTags = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(0, mapper.readTree(otherTags).size(), "User B must not see user A's tags");
    }
}
