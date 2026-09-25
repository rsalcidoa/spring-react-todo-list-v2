## Purpose

Provides basic user authentication and authorization for task ownership.

## ADDED Requirements

### Requirement: User Registration
The system SHALL allow new users to register with email and password.

#### Scenario: Successful User Registration
- **WHEN** user sends POST request to /v1/auth/register with valid credentials
- **THEN** system returns 201 Created with user data (without password)

### Requirement: User Login
The system SHALL allow registered users to login and receive a JWT token.

#### Scenario: Successful User Login
- **WHEN** user sends POST request to /v1/auth/login with valid credentials
- **THEN** system returns 200 OK with JWT token

### Requirement: Task Ownership
The system SHALL associate tasks with the user who created them.

#### Scenario: User Creates Task
- **WHEN** authenticated user creates a task via POST /v1/tasks
- **THEN** system assigns the task to that user's ID

### Requirement: Task Access Control
The system SHALL only allow users to view, update, or delete their own tasks.

#### Scenario: User Tries to Access Another User's Task
- **WHEN** user sends GET request to /v1/tasks/{id} belonging to another user
- **THEN** system returns 403 Forbidden
