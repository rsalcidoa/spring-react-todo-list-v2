package com.example.todo.service;

import com.example.todo.model.Recurrence;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecurrenceRuleTest {

    @Test
    void dailyAdvancesOneDay() {
        assertEquals(LocalDate.of(2026, 2, 1),
                RecurrenceRule.nextDueDate(LocalDate.of(2026, 1, 31), Recurrence.DAILY));
    }

    @Test
    void weeklyAdvancesSevenDays() {
        assertEquals(LocalDate.of(2026, 1, 8),
                RecurrenceRule.nextDueDate(LocalDate.of(2026, 1, 1), Recurrence.WEEKLY));
    }

    @Test
    void monthlyClampsToMonthEnd() {
        assertEquals(LocalDate.of(2026, 2, 28),
                RecurrenceRule.nextDueDate(LocalDate.of(2026, 1, 31), Recurrence.MONTHLY));
    }

    @Test
    void noneIsUnchanged() {
        LocalDate d = LocalDate.of(2026, 1, 1);
        assertEquals(d, RecurrenceRule.nextDueDate(d, Recurrence.NONE));
    }
}
