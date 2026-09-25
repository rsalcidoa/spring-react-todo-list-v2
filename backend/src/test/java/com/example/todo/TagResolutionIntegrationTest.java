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

import com.example.todo.model.Tag;
import com.example.todo.repository.TagRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TagResolutionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TagRepository tagRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private String registerAndLogin(String uuid) throws Exception {
        String userEmail = uuid + "@example.com";
        String userJson = String.format("{\"email\": \"%s\", \"password\": \"secret123\"}", userEmail);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated());

        MvcResult loginResp = mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(loginResp.getResponse().getContentAsString()).path("token").asText();
    }

    @Test
    void createTaskWithPaddedTagNameReusesExistingWorkTag() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String token = registerAndLogin(uuid);

        // Create "Work" tag via POST /v1/tags
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated());

        // Create task with padded name " Work " — should resolve to existing "Work"
        String taskJson = "{\"title\": \"Padded\", \"description\": \"d\", \"priority\": \"LOW\", \"tagNames\": [\" Work \"]}";
        MvcResult result = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson))
                .andExpect(status().isCreated())
                .andReturn();

        var body = mapper.readTree(result.getResponse().getContentAsString());
        assertEquals(1, body.path("tags").size(), "Should have exactly 1 tag");
        assertEquals("Work", body.path("tags").get(0).path("name").asText(), "Tag name should be canonical 'Work'");

        // Verify only 1 tag row exists for this user (no duplicate)
        MvcResult tagsResp = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(1, mapper.readTree(tagsResp.getResponse().getContentAsString()).size(),
                "Only 1 tag should exist (no duplicate)");
    }

    @Test
    void twoSequentialCreateTaskWithSameNewTagResultInOneRow() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String token = registerAndLogin(uuid);
        String tagName = "NewTag" + uuid;

        // First request creates the tag
        String taskJson1 = String.format("{\"title\": \"T1\", \"description\": \"d\", \"priority\": \"LOW\", \"tagNames\": [\"%s\"]}", tagName);
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson1))
                .andExpect(status().isCreated());

        // Second request reuses the same tag name
        String taskJson2 = String.format("{\"title\": \"T2\", \"description\": \"d\", \"priority\": \"LOW\", \"tagNames\": [\"%s\"]}", tagName);
        mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson2))
                .andExpect(status().isCreated());

        // Verify only 1 tag row exists
        MvcResult tagsResp = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(1, mapper.readTree(tagsResp.getResponse().getContentAsString()).size(),
                "Only 1 tag row should exist after two creates with same name");
    }

    @Test
    void updateTaskWithLowercaseTagNameResolvesExistingWorkTag() throws Exception {
        String uuid = UUID.randomUUID().toString();
        String token = registerAndLogin(uuid);

        // Create "Work" tag via POST /v1/tags
        mockMvc.perform(post("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Work\"}"))
                .andExpect(status().isCreated());

        // Create a task first
        String taskJson = "{\"title\": \"T\", \"description\": \"d\", \"priority\": \"LOW\"}";
        MvcResult createResp = mockMvc.perform(post("/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskJson))
                .andExpect(status().isCreated())
                .andReturn();
        Long taskId = mapper.readTree(createResp.getResponse().getContentAsString()).path("id").asLong();

        // Update with lowercase "work" — should resolve to existing "Work"
        String updateJson = "{\"title\": \"T\", \"description\": \"d\", \"priority\": \"LOW\", \"tagNames\": [\"work\"]}";
        MvcResult updateResp = mockMvc.perform(put("/v1/tasks/" + taskId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isOk())
                .andReturn();

        var body = mapper.readTree(updateResp.getResponse().getContentAsString());
        assertEquals(1, body.path("tags").size(), "Should have exactly 1 tag");
        assertEquals("Work", body.path("tags").get(0).path("name").asText(),
                "Tag name should be canonical 'Work' (case preserved from existing)");

        // Verify no duplicate created
        MvcResult tagsResp = mockMvc.perform(get("/v1/tags")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(1, mapper.readTree(tagsResp.getResponse().getContentAsString()).size(),
                "Only 1 tag should exist (no duplicate from case-insensitive match)");
    }
}
