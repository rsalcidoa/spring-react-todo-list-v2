## Purpose

Provides CRUD operations for managing tasks with priority levels and due dates.

## ADDED Requirements

### Requirement: Create Task
The system SHALL allow users to create a new task with title, description, priority, and due date.

#### Scenario: Successful Task Creation
- **WHEN** user sends POST request to /v1/tasks with valid task data
- **THEN** system returns 201 Created with the created task

### Requirement: Read Task
The system SHALL allow users to retrieve a single task by ID.

#### Scenario: Successful Task Retrieval
- **WHEN** user sends GET request to /v1/tasks/{id}
- **THEN** system returns 200 OK with the task data

### Requirement: List All Tasks
The system SHALL allow users to retrieve all tasks.

#### Scenario: Successful Task Listing
- **WHEN** user sends GET request to /v1/tasks
- **THEN** system returns 200 OK with array of all tasks

### Requirement: Update Task
The system SHALL allow users to update an existing task.

#### Scenario: Successful Task Update
- **WHEN** user sends PUT request to /v1/tasks/{id} with valid task data
- **THEN** system returns 200 OK with the updated task

### Requirement: Delete Task
The system SHALL allow users to delete a task.

#### Scenario: Successful Task Deletion
- **WHEN** user sends DELETE request to /v1/tasks/{id}
- **THEN** system returns 204 No Content

### Requirement: Task Priority Levels
The system SHALL support three priority levels: LOW, MEDIUM, HIGH.

#### Scenario: Task with High Priority
- **WHEN** user creates task with priority HIGH
- **THEN** system stores and returns priority as HIGH

### Requirement: Task Due Date
The system SHALL allow tasks to have an optional due date in ISO-8601 format.

#### Scenario: Successful Task Creation with Due Date
- **WHEN** user creates task with dueDate 2024-12-31T23:59:59Z
- **THEN** system stores and returns the exact same timestamp
