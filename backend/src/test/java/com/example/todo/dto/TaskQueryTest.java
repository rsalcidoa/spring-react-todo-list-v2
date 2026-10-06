package com.example.todo.dto;

import com.example.todo.exception.InvalidQueryValueException;
import com.example.todo.exception.InvalidStatusValueException;
import com.example.todo.model.Priority;
import com.example.todo.model.TaskStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskQueryTest {

    @Test
    void defaultsToCreatedAtDescending() {
        TaskQuery q = TaskQuery.parse(null, null, null, null, null, null);
        assertEquals(TaskSortField.createdAt, q.sort());
        assertEquals(SortDirection.desc, q.dir());
        assertNull(q.status());
        assertNull(q.q());
        assertNull(q.priority());
        assertTrue(q.tagIds().isEmpty());
    }

    @Test
    void defaultDirectionIsAscendingForNonCreatedAtFields() {
        assertEquals(SortDirection.asc, TaskQuery.parse(null, null, null, null, "dueDate", null).dir());
        assertEquals(SortDirection.asc, TaskQuery.parse(null, null, null, null, "title", null).dir());
    }

    @Test
    void parsesFiltersAndTrimsSearch() {
        TaskQuery q = TaskQuery.parse("PENDING", "  informe ", "HIGH", List.of("3", "5"), "title", "asc");

        assertEquals(TaskStatus.PENDING, q.status());
        assertEquals("informe", q.q());
        assertEquals(Priority.HIGH, q.priority());
        assertEquals(List.of(3L, 5L), q.tagIds());
        assertEquals(TaskSortField.title, q.sort());
        assertEquals(SortDirection.asc, q.dir());
    }

    @Test
    void blankSearchBecomesNull() {
        assertNull(TaskQuery.parse(null, "   ", null, null, null, null).q());
    }

    @Test
    void rejectsInvalidStatusWithStatusContract() {
        InvalidStatusValueException ex = assertThrows(InvalidStatusValueException.class,
                () -> TaskQuery.parse("INVALID", null, null, null, null, null));
        assertEquals("status", ex.getField());
    }

    @Test
    void rejectsInvalidPriority() {
        InvalidQueryValueException ex = assertThrows(InvalidQueryValueException.class,
                () -> TaskQuery.parse(null, null, "URGENT", null, null, null));
        assertEquals("priority", ex.getField());
    }

    @Test
    void rejectsInvalidSort() {
        InvalidQueryValueException ex = assertThrows(InvalidQueryValueException.class,
                () -> TaskQuery.parse(null, null, null, null, "bogus", null));
        assertEquals("sort", ex.getField());
    }

    @Test
    void rejectsInvalidDirection() {
        InvalidQueryValueException ex = assertThrows(InvalidQueryValueException.class,
                () -> TaskQuery.parse(null, null, null, null, null, "sideways"));
        assertEquals("dir", ex.getField());
    }

    @Test
    void rejectsNonNumericTagId() {
        InvalidQueryValueException ex = assertThrows(InvalidQueryValueException.class,
                () -> TaskQuery.parse(null, null, null, List.of("abc"), null, null));
        assertEquals("tagIds", ex.getField());
    }
}
