package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.exception.UnauthenticatedException;
import com.example.todo.model.Priority;
import com.example.todo.model.Tag;
import com.example.todo.model.Task;
import com.example.todo.model.TaskStatus;
import com.example.todo.model.User;
import com.example.todo.repository.TaskRepository;
import com.example.todo.repository.TagRepository;
import com.example.todo.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskServiceTest {

    private TaskRepository taskRepository;
    private TagRepository tagRepository;
    private TagService tagService;
    private CurrentUserProvider currentUser;
    private PlatformTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;
    private TaskService service;

    private final User me = userWithId(1L, "me@example.com");
    private final User other = userWithId(2L, "other@example.com");

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        tagRepository = mock(TagRepository.class);
        tagService = mock(TagService.class);
        currentUser = mock(CurrentUserProvider.class);
        transactionManager = mock(PlatformTransactionManager.class);
        transactionTemplate = new TransactionTemplate(transactionManager);
        service = new TaskService(taskRepository, tagRepository, tagService, currentUser, transactionManager);
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    private Task taskOwnedBy(Long id, User owner) {
        Task task = new Task();
        task.setId(id);
        task.setTitle("Task " + id);
        task.setUser(owner);
        return task;
    }

    @Test
    void getTaskByIdReturnsOwnTask() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        TaskResponse response = service.getTaskById(10L);

        assertEquals(10L, response.getId());
    }

    @Test
    void getTaskByIdThrowsOwnershipDeniedForForeignTask() {
        Task task = taskOwnedBy(10L, other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> service.getTaskById(10L));
    }

    @Test
    void getTaskByIdThrowsNotFoundWhenMissing() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getTaskById(99L));
    }

    @Test
    void getTaskByIdThrowsUnauthenticatedWithoutUser() {
        when(currentUser.requireCurrent()).thenThrow(new UnauthenticatedException());

        assertThrows(UnauthenticatedException.class, () -> service.getTaskById(10L));
    }

    @Test
    void updateTaskUpdatesOwnTask() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        TaskRequest request = new TaskRequest("Updated", "desc", Priority.HIGH, null);

        TaskResponse response = service.updateTask(10L, request);

        assertEquals("Updated", response.getTitle());
    }

    @Test
    void updateTaskThrowsOwnershipDeniedForForeignTask() {
        Task task = taskOwnedBy(10L, other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());
        TaskRequest request = new TaskRequest("Updated", "desc", Priority.HIGH, null);

        assertThrows(OwnershipDeniedException.class, () -> service.updateTask(10L, request));
    }

    @Test
    void updateTaskThrowsNotFoundWhenMissing() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());
        TaskRequest request = new TaskRequest("Updated", "desc", Priority.HIGH, null);

        assertThrows(ResourceNotFoundException.class, () -> service.updateTask(99L, request));
    }

    @Test
    void updateTaskThrowsUnauthenticatedWithoutUser() {
        when(currentUser.requireCurrent()).thenThrow(new UnauthenticatedException());
        TaskRequest request = new TaskRequest("Updated", "desc", Priority.HIGH, null);

        assertThrows(UnauthenticatedException.class, () -> service.updateTask(10L, request));
    }

    @Test
    void deleteTaskDeletesOwnTask() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        service.deleteTask(10L);

        org.mockito.Mockito.verify(taskRepository).delete(task);
    }

    @Test
    void deleteTaskThrowsOwnershipDeniedForForeignTask() {
        Task task = taskOwnedBy(10L, other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> service.deleteTask(10L));
    }

    @Test
    void deleteTaskThrowsNotFoundWhenMissing() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteTask(99L));
    }

    @Test
    void deleteTaskThrowsUnauthenticatedWithoutUser() {
        when(currentUser.requireCurrent()).thenThrow(new UnauthenticatedException());

        assertThrows(UnauthenticatedException.class, () -> service.deleteTask(10L));
    }

    @Test
    void applyStatusThrowsUnauthenticatedWithoutUser() {
        when(currentUser.requireCurrent()).thenThrow(new UnauthenticatedException());

        assertThrows(UnauthenticatedException.class, () -> service.applyStatus(10L, "COMPLETED"));
    }

    @Test
    void createTaskAssignsCurrentUserFromProvider() {
        when(currentUser.requireCurrent()).thenReturn(me);
        TaskRequest request = new TaskRequest("New", "desc", Priority.LOW, null);

        TaskResponse response = service.createTask(request);

        assertEquals("New", response.getTitle());
        org.mockito.Mockito.verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createTaskThrowsUnauthenticatedWithoutUser() {
        when(currentUser.requireCurrent()).thenThrow(new UnauthenticatedException());
        TaskRequest request = new TaskRequest("New", "desc", Priority.LOW, null);

        assertThrows(UnauthenticatedException.class, () -> service.createTask(request));
    }

    @Test
    void createTaskResolvesAllTagNamesInOneBatch() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(tagService.resolve(eq(me), any(List.class)))
                .thenReturn(List.of(new TagResponse(1L, "Work"), new TagResponse(2L, "Personal")));
        when(tagRepository.findAllById(List.of(1L, 2L)))
                .thenReturn(List.of(new Tag("Work", me), new Tag("Personal", me)));
        TaskRequest request = new TaskRequest("T", "d", Priority.LOW, null);
        request.setTagNames(java.util.Set.of("Work", "Personal"));

        TaskResponse response = service.createTask(request);

        verify(tagService, times(1)).resolve(eq(me), any(List.class));
        assertEquals(2, response.getTags().size());
    }

    @Test
    void applyStatusValidSetsAndSaves() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        TaskResponse response = service.applyStatus(10L, "COMPLETED");

        assertEquals(TaskStatus.COMPLETED, response.getStatus());
    }

    @Test
    void applyStatusInvalidThrowsInvalidStatusValueException() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertThrows(InvalidStatusValueException.class, () -> service.applyStatus(10L, "INVALID"));
    }

    @Test
    void applyStatusThrowsOwnershipDeniedForForeignTask() {
        Task task = taskOwnedBy(10L, other);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> service.applyStatus(10L, "ACTIVE"));
    }

    @Test
    void applyStatusThrowsNotFoundWhenMissing() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.applyStatus(99L, "ACTIVE"));
    }

    @Test
    void updateTaskWithInvalidStatusThrowsInvalidStatusValueException() {
        Task task = taskOwnedBy(10L, me);
        when(currentUser.requireCurrent()).thenReturn(me);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        TaskRequest request = new TaskRequest("Updated", "desc", Priority.HIGH, null);
        request.setStatus("INVALID");

        assertThrows(InvalidStatusValueException.class, () -> service.updateTask(10L, request));
    }

    @Test
    void createTaskWithInvalidStatusThrowsInvalidStatusValueException() {
        when(currentUser.requireCurrent()).thenReturn(me);
        TaskRequest request = new TaskRequest("New", "desc", Priority.LOW, null);
        request.setStatus("INVALID");

        assertThrows(InvalidStatusValueException.class, () -> service.createTask(request));
    }

    @Test
    void createTaskContentionBeyondRetriesReturns409Not500() {
        when(currentUser.requireCurrent()).thenReturn(me);
        when(tagService.resolve(eq(me), any(List.class)))
                .thenReturn(List.of(new TagResponse(1L, "Work")));
        when(tagRepository.findAllById(List.of(1L))).thenReturn(List.of(new Tag("Work", me)));
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("constraint"))
                .when(taskRepository).save(any(Task.class));
        TaskRequest request = new TaskRequest("T", "d", Priority.LOW, null);
        request.setTagNames(java.util.Set.of("Work"));

        assertThrows(com.example.todo.exception.TagAlreadyExistsException.class,
                () -> service.createTask(request));

        // both attempts re-resolved (rollback of attempt 1 included the tag saves)
        verify(tagService, times(2)).resolve(eq(me), any(List.class));
    }
}
