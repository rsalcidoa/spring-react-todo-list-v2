package com.example.todo.service;

import com.example.todo.model.Recurrence;

import java.time.LocalDate;

/** Pure next-occurrence computation for the supported recurrence rules. */
public final class RecurrenceRule {

    private RecurrenceRule() {}

    public static LocalDate nextDueDate(LocalDate current, Recurrence rule) {
        return switch (rule) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusDays(7);
            case MONTHLY -> current.plusMonths(1); // java.time clamps to the last valid day
            case NONE -> current;
        };
    }
}
