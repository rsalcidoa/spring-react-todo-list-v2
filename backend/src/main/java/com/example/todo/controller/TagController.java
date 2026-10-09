package com.example.todo.controller;

import com.example.todo.dto.TagRequest;
import com.example.todo.dto.TagResponse;
import com.example.todo.model.User;
import com.example.todo.security.CurrentUserProvider;
import com.example.todo.service.TagService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/tags")
public class TagController {
    private final TagService tagService;
    private final CurrentUserProvider currentUser;

    @Autowired
    public TagController(TagService tagService, CurrentUserProvider currentUser) {
        this.tagService = tagService;
        this.currentUser = currentUser;
    }

    /**
     * List all tags of the authenticated user sorted alphabetically.
     */
    @GetMapping
    public ResponseEntity<List<TagResponse>> getAllTags() {
        User me = currentUser.requireCurrent();
        return ResponseEntity.ok(tagService.list(me));
    }

    /**
     * Create a new tag for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<TagResponse> createTag(@Valid @RequestBody TagRequest request) {
        User me = currentUser.requireCurrent();
        TagResponse created = tagService.create(me, request.getName());
        return ResponseEntity.status(201).body(created);
    }

    /**
     * Delete a tag by id. Cascade unassign from tasks via DB constraints.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
