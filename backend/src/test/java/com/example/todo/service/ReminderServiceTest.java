package com.example.todo.service;

import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.model.Priority;
import com.example.todo.model.Task;
import com.example.todo.model.User;
import com.example.todo.repository.TaskRepository;
import com.example.todo.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReminderServiceTest {

    private TaskRepository taskRepository;
    private CurrentUserProvider currentUser;
    private Clock clock;
    private ReminderService service;

    private final User me = userWithId(1L);
    private final User other = userWithId(2L);

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        currentUser = mock(CurrentUserProvider.class);
        clock = Clock.fixed(Instant.parse("2026-06-01T00:00:00Z"), ZoneOffset.UTC);
        service = new ReminderService(taskRepository, currentUser, clock);
    }

    private User userWithId(long id) {
        User user = new User("u" + id + "@example.com", "x");
        user.setId(id);
        return user;
    }

    private Task taskOwnedBy(User owner) {
        Task task = new Task();
        task.setId(10L);
        task.setTitle("Reminder");
        task.setPriority(Priority.LOW);
        task.setUser(owner);
        return task;
    }

    @Test
    void dueRemindersReturnsTheRepositoryRows() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findByUserAndReminderAtLessThanEqualAndReminderNotifiedAtIsNullAndDeletedAtIsNull(me, LocalDateTime.now(clock)))
                .thenReturn(List.of(taskOwnedBy(me)));

        assertEquals(1, service.dueReminders().size());
    }

    @Test
    void acknowledgeSetsNotifiedWhenUnset() {
        Task task = taskOwnedBy(me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        service.acknowledge(10L);

        assertNotNull(task.getReminderNotifiedAt());
        verify(taskRepository).save(task);
    }

    @Test
    void acknowledgeIsIdempotent() {
        Task task = taskOwnedBy(me);
        LocalDateTime already = LocalDateTime.of(2026, 1, 1, 8, 0);
        task.setReminderNotifiedAt(already);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        service.acknowledge(10L);

        assertEquals(already, task.getReminderNotifiedAt());
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void acknowledgeRespectsOwnership() {
        Task task = taskOwnedBy(other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> service.acknowledge(10L));
    }
}
