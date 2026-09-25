package com.example.todo.service;

import com.example.todo.dto.TagResponse;
import com.example.todo.exception.OwnershipDeniedException;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.exception.TagAlreadyExistsException;
import com.example.todo.model.Tag;
import com.example.todo.model.User;
import com.example.todo.repository.TagRepository;
import com.example.todo.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TagServiceTest {

    private TagRepository tagRepository;
    private CurrentUserProvider currentUser;
    private TagService service;

    private final User me = userWithId(1L, "me@example.com");
    private final User other = userWithId(2L, "other@example.com");

    @BeforeEach
    void setUp() {
        tagRepository = mock(TagRepository.class);
        currentUser = mock(CurrentUserProvider.class);
        service = new TagService(tagRepository, currentUser);
    }

    private User userWithId(long id, String email) {
        User user = new User(email, "password");
        user.setId(id);
        return user;
    }

    @Test
    void createExistingCaseInsensitiveThrowsTagAlreadyExists() {
        Tag existing = new Tag("Work", me);
        when(tagRepository.findByUserId(1L)).thenReturn(List.of(existing));

        assertThrows(TagAlreadyExistsException.class, () -> service.create(me, "work"));
    }

    @Test
    void createNewSavesTrimmedName() {
        when(tagRepository.findByUserId(1L)).thenReturn(List.of());
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));

        TagResponse response = service.create(me, "  Personal ");

        assertEquals("Personal", response.getName());
    }

    @Test
    void createSaveThrowsDataIntegrityViolationThenReLookupFindsExisting() {
        when(tagRepository.findByUserId(1L))
                .thenReturn(List.of())
                .thenReturn(List.of(new Tag("Work", me)));
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("unique constraint"))
                .when(tagRepository).save(any(Tag.class));

        assertThrows(TagAlreadyExistsException.class, () -> service.create(me, "work"));
    }

    @Test
    void listReturnsOnlyTagResponsesSortedCaseInsensitive() {
        Tag b = new Tag("beta", me);
        Tag a = new Tag("Alpha", me);
        when(tagRepository.findByUserId(1L)).thenReturn(List.of(b, a));

        List<TagResponse> response = service.list(me);

        assertEquals(2, response.size());
        assertEquals("Alpha", response.get(0).getName());
        assertEquals("beta", response.get(1).getName());
    }

    @Test
    void deleteThrowsNotFoundWhenMissing() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.delete(me, 99L));
    }

    @Test
    void deleteThrowsOwnershipDeniedForForeignTag() {
        Tag foreign = new Tag("Work", other);
        when(tagRepository.findById(10L)).thenReturn(Optional.of(foreign));
        when(currentUser.requireOwned(2L)).thenThrow(new OwnershipDeniedException());

        assertThrows(OwnershipDeniedException.class, () -> service.delete(me, 10L));
    }

    @Test
    void deleteOwnTagSucceeds() {
        Tag mine = new Tag("Work", me);
        when(tagRepository.findById(10L)).thenReturn(Optional.of(mine));
        when(currentUser.requireOwned(1L)).thenReturn(me);

        service.delete(me, 10L);

        verify(tagRepository).delete(mine);
    }

    @Test
    void resolveCallsFindByUserIdOnceAndCreatesMissing() {
        Tag existing = new Tag("Work", me);
        when(tagRepository.findByUserId(1L)).thenReturn(List.of(existing));
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> inv.getArgument(0));

        List<Tag> result = service.resolve(me, List.of("work", " Personal ", "personal"));

        verify(tagRepository, times(1)).findByUserId(1L);
        assertEquals(2, result.size());
        assertSame(existing, result.get(0));
        assertEquals("Personal", result.get(1).getName());
    }
}
