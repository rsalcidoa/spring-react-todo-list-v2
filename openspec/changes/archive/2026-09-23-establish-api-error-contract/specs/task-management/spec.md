# Spec Delta — task-management

## MODIFIED Requirements

### Requirement: Task Due Date

The system SHALL allow tasks to have an optional due date in date-only format (`yyyy-MM-dd`).

**ID**: REQ-TM-007
**Affected files**: 
- `com.example.todo.dto.TaskRequest.java` — `dueDate` field is `@JsonFormat(pattern="yyyy-MM-dd") LocalDate`
- `com.example.todo.model.Task.java` — `dueDate` column is `date` type in PostgreSQL
- `frontend/src/components/AddTaskModal.tsx` — `<input type="date">` produces `yyyy-MM-dd`

#### Scenario: Successful Task Creation with Due Date
- **WHEN** user creates task with dueDate 2024-12-31
- **THEN** system stores and returns the exact same date
