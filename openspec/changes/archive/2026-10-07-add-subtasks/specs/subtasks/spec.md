# Spec Delta

## Purpose

Lets a task carry one level of child tasks (a checklist) with progress, without introducing arbitrary task nesting.

## ADDED Requirements

### Requirement: Subtask Assignment
A task SHALL accept an optional `parentId` referencing another task owned by the same user. A subtask SHALL NOT itself have a parent (one level only): sending a `parentId` that points to a task which already has a `parentId` SHALL be rejected with 400 Bad Request naming `parentId`. An unknown or foreign parent SHALL be rejected with 400 as well.

**ID**: REQ-SUB-001
**Affected files**:
- `com.example.todo.dto.TaskRequest` — optional `parentId`
- `com.example.todo.service.SubtaskService` — validates the one-level rule and ownership
- `com.example.todo.model.Task` — `parent` (nullable self-FK)

#### Scenario: Create a subtask
- **WHEN** the user creates a task with `parentId` of one of their top-level tasks
- **THEN** system returns 201 Created with the subtask carrying that parent

#### Scenario: No second level
- **WHEN** the user creates a task whose `parentId` is itself a subtask
- **THEN** system returns 400 Bad Request with `errors.parentId`

#### Scenario: Foreign parent rejected
- **WHEN** the user sends a `parentId` that does not belong to them
- **THEN** system returns 400 Bad Request with `errors.parentId`

### Requirement: Board Listing Excludes Subtasks
The board listing (`GET /v1/tasks`) SHALL return top-level tasks only (those with no `parentId`). Subtasks SHALL be retrieved per parent via `GET /v1/tasks/{id}/subtasks` (404/403 per the shared ownership seam).

**ID**: REQ-SUB-002
**Affected files**:
- `com.example.todo.controller.TaskController.getAllTasks()` / `getSubtasks()`
- `com.example.todo.repository.TaskRepository` — top-level query and find-by-parent

#### Scenario: Subtasks hidden from the board
- **WHEN** the user lists tasks and has tasks with subtasks
- **THEN** only top-level tasks are returned; subtasks are not included

#### Scenario: Fetch subtasks of a task
- **WHEN** the user calls `GET /v1/tasks/{id}/subtasks`
- **THEN** system returns that task's subtasks for the owner

### Requirement: Subtask Progress and Cascade
A parent task response SHALL include a `subtaskProgress` summary (`done` and `total`). Deleting a parent SHALL delete its subtasks (cascade); deleting a subtask SHALL NOT affect the parent.

**ID**: REQ-SUB-003
**Affected files**:
- `com.example.todo.dto.TaskResponse` — `subtaskProgress`
- `com.example.todo.model.Task` — `@OneToMany(cascade = ALL, orphanRemoval = true)` children
- `com.example.todo.service.SubtaskService` — progress computation

#### Scenario: Progress reflects children
- **WHEN** a parent has 4 subtasks, 2 of them COMPLETED
- **THEN** its `subtaskProgress` is `{ "done": 2, "total": 4 }`

#### Scenario: Deleting a parent cascades
- **WHEN** the user deletes a parent task
- **THEN** its subtasks are deleted as well

#### Scenario: Deleting a subtask leaves the parent
- **WHEN** the user deletes a subtask
- **THEN** the parent remains, with progress reduced
