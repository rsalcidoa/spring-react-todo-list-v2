package com.example.todo.dto;

import com.example.todo.exception.InvalidQueryValueException;
import com.example.todo.model.Priority;
import com.example.todo.model.TaskStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Composable, validated query for the task listing. Parsing lives in the Task
 * module (not the controller) so invalid values reuse the structured 400
 * contract instead of a generic conversion error.
 */
public record TaskQuery(
        TaskStatus status,
        String q,
        Priority priority,
        List<Long> tagIds,
        TaskSortField sort,
        SortDirection dir) {

    public static TaskQuery parse(String status, String q, String priority,
                                  List<String> tagIds, String sort, String dir) {
        TaskStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            parsedStatus = TaskStatus.parse(status);
        }

        String parsedQ = (q == null || q.isBlank()) ? null : q.trim();

        Priority parsedPriority = null;
        if (priority != null && !priority.isBlank()) {
            try {
                parsedPriority = Priority.valueOf(priority);
            } catch (IllegalArgumentException e) {
                throw new InvalidQueryValueException("priority", "Priority must be LOW, MEDIUM or HIGH");
            }
        }

        List<Long> parsedTagIds = new ArrayList<>();
        if (tagIds != null) {
            for (String id : tagIds) {
                if (id == null || id.isBlank()) {
                    continue;
                }
                try {
                    parsedTagIds.add(Long.parseLong(id.trim()));
                } catch (NumberFormatException e) {
                    throw new InvalidQueryValueException("tagIds", "Tag ids must be numeric");
                }
            }
        }

        boolean sortProvided = sort != null && !sort.isBlank();
        TaskSortField parsedSort = TaskSortField.createdAt;
        if (sortProvided) {
            try {
                parsedSort = TaskSortField.valueOf(sort);
            } catch (IllegalArgumentException e) {
                throw new InvalidQueryValueException("sort", "Sort must be createdAt, dueDate, priority or title");
            }
        }

        SortDirection parsedDir = (!sortProvided || parsedSort == TaskSortField.createdAt)
                ? SortDirection.desc
                : SortDirection.asc;
        if (dir != null && !dir.isBlank()) {
            try {
                parsedDir = SortDirection.valueOf(dir);
            } catch (IllegalArgumentException e) {
                throw new InvalidQueryValueException("dir", "Direction must be asc or desc");
            }
        }

        return new TaskQuery(parsedStatus, parsedQ, parsedPriority, List.copyOf(parsedTagIds), parsedSort, parsedDir);
    }

    /**
     * Validates the optional page/size pair and builds the page request, or
     * empty when neither was provided (plain-array listing). Owning the bounds
     * here keeps the controller free of query parsing.
     */
    public static Optional<Pageable> pageable(Integer page, Integer size) {
        if (page == null && size == null) {
            return Optional.empty();
        }
        int p = page == null ? 0 : page;
        int s = size == null ? 20 : size;
        if (p < 0) {
            throw new InvalidQueryValueException("page", "Page must be >= 0");
        }
        if (s < 1 || s > 100) {
            throw new InvalidQueryValueException("size", "Size must be between 1 and 100");
        }
        return Optional.of(PageRequest.of(p, s));
    }
}
