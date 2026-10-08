package com.example.todo.controller;

import com.example.todo.dto.ProjectRequest;
import com.example.todo.dto.ProjectResponse;
import com.example.todo.security.CurrentUserProvider;
import com.example.todo.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final CurrentUserProvider currentUser;

    public ProjectController(ProjectService projectService, CurrentUserProvider currentUser) {
        this.projectService = projectService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.list(currentUser.requireCurrent()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(@Valid @RequestBody ProjectRequest request) {
        return projectService.create(currentUser.requireCurrent(), request.getName(), request.getDescription());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> renameProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.rename(id, request.getName(), request.getDescription()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
