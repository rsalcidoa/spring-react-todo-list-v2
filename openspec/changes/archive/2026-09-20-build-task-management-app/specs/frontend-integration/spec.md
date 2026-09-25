## Purpose

Provides React frontend integration with the REST API for task management.

## ADDED Requirements

### Requirement: Task List View
The system SHALL display all tasks in a list format showing title, priority, and due date.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays all user's tasks in a scrollable list

### Requirement: Create Task Form
The system SHALL provide a form to create new tasks with title, description, priority, and due date.

#### Scenario: User Creates New Task
- **WHEN** user fills form and clicks "Create"
- **THEN** system adds task to list and shows success message

### Requirement: Edit Task Functionality
The system SHALL allow users to edit existing tasks.

#### Scenario: User Edits Task
- **WHEN** user clicks edit button on a task and saves changes
- **THEN** system updates the task in the list

### Requirement: Delete Task Functionality
The system SHALL allow users to delete tasks.

#### Scenario: User Deletes Task
- **WHEN** user clicks delete button on a task
- **THEN** system removes task from list and shows confirmation

### Requirement: API Integration
The system SHALL communicate with backend via REST API endpoints.

#### Scenario: Frontend Makes API Request
- **WHEN** frontend sends GET request to /v1/tasks
- **THEN** system receives JSON response with task array
