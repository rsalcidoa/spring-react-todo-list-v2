package com.example.todo.repository;

import com.example.todo.model.Project;
import com.example.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUser(User user);
    Optional<Project> findByUserIdAndNameIgnoreCase(Long userId, String name);
}
