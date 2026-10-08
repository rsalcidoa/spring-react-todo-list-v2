package com.example.todo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.model.TaskStatus;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
    List<Task> findByUser(User user);
    List<Task> findByUserAndStatus(User user, TaskStatus status);
    List<Task> findByUserAndReminderAtLessThanEqualAndReminderNotifiedAtIsNullAndDeletedAtIsNull(User user, LocalDateTime now);
    boolean existsByRecurrenceSourceId(Long recurrenceSourceId);
    long deleteByProjectId(Long projectId);
}
