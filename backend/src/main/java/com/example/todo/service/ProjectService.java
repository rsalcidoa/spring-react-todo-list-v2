package com.example.todo.service;

import com.example.todo.dto.ProjectResponse;
import com.example.todo.exception.ProjectAlreadyExistsException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.model.Project;
import com.example.todo.model.User;
import com.example.todo.repository.ProjectRepository;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUser;

    public ProjectService(ProjectRepository projectRepository, TaskRepository taskRepository, CurrentUserProvider currentUser) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.currentUser = currentUser;
    }

    public List<ProjectResponse> list(User me) {
        return projectRepository.findByUser(me).stream()
                .map(p -> new ProjectResponse(p.getId(), p.getName(), p.getDescription()))
                .sorted(Comparator.comparing(ProjectResponse::name, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    public ProjectResponse create(User me, String rawName, String rawDescription) {
        String name = rawName.trim();
        if (projectRepository.findByUserIdAndNameIgnoreCase(me.getId(), name).isPresent()) {
            throw new ProjectAlreadyExistsException();
        }
        Project project = new Project(name, me);
        project.setDescription(normalizeDescription(rawDescription));
        Project saved = projectRepository.save(project);
        return new ProjectResponse(saved.getId(), saved.getName(), saved.getDescription());
    }

    public ProjectResponse rename(Long id, String rawName, String rawDescription) {
        Project project = projectRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(project.getUser().getId());
        String name = rawName.trim();
        projectRepository.findByUserIdAndNameIgnoreCase(project.getUser().getId(), name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> { throw new ProjectAlreadyExistsException(); });
        project.setName(name);
        project.setDescription(normalizeDescription(rawDescription));
        projectRepository.save(project);
        return new ProjectResponse(project.getId(), project.getName(), project.getDescription());
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            return null;
        }
        return rawDescription.trim();
    }

    @Transactional
    public void delete(Long id) {
        Project project = projectRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        currentUser.requireOwned(project.getUser().getId());
        // Delete the project's tasks (their subtasks cascade via the parent_id FK), then the project.
        taskRepository.deleteByProjectId(id);
        projectRepository.delete(project);
    }
}
