# Spec Delta — frontend-integration (español total)

## MODIFIED Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts and a board total, entirely in Spanish UI copy: board `Tablero`, columns `Por hacer` / `En progreso` / `Hecho`, `+ Tarea`, `Cerrar sesión`. Due-states read `Vencida` / `Vence hoy` / fecha futura / sin chip. The tag filter, skeletons, empty states and notices from the board-UX change SHALL also read in Spanish.

#### Scenario: Spanish board chrome
- **WHEN** user opens `/tasks`
- **THEN** header shows `Tablero`, total, `+ Tarea` and `Cerrar sesión`; columns show `Por hacer`, `En progreso`, `Hecho` with counts; no English chrome remains

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays all user's tasks in a scrollable list

### Requirement: Create Task Form
The system SHALL provide the task form in Spanish: `Nueva tarea` / `Editar tarea`, `Título`, `Descripción`, `Prioridad` (`Baja/Media/Alta`), `Estado` (`Pendiente/En progreso/Completada`), `Vencimiento`, `Etiquetas`, `Nueva etiqueta`, `Crear`, `Guardar`, `Cancelar`. Field-level validation messages SHALL read in Spanish. (Wire values `LOW`, `PENDING`, … are unchanged.)

#### Scenario: Spanish form blocks empty title inline
- **WHEN** user submits with an empty title
- **THEN** a Spanish field-level message prevents submit with no request sent

#### Scenario: User Creates New Task
- **WHEN** user fills form and clicks `Crear`
- **THEN** system adds task to list and shows success message

### Requirement: Tag Creation from Modal
Tag pills, creation and deletion flows SHALL read in Spanish: `Esta etiqueta ya existe` (409), `Nombre de etiqueta inválido` (400), `La etiqueta ya no existe` (404), delete confirmation naming the impact in Spanish.

#### Scenario: Spanish duplicate feedback
- **WHEN** user creates an existing tag
- **THEN** the banner reads `Esta etiqueta ya existe`

#### Scenario: User creates a new tag from the modal
- **WHEN** user types a tag name (1-50 chars) in the new tag input and clicks `Crear`
- **THEN** the system creates the tag via the repository and it appears in the tag pills list with its real id
- **AND** no client-fabricated id ever reaches task reconciliation

#### Scenario: Duplicate tag creation is rejected
- **WHEN** user attempts to create a tag that already exists for the user
- **THEN** the system returns 409 Conflict
- **AND** the ErrorBanner displays the duplicate error message

#### Scenario: Blank tag name is rejected
- **WHEN** user clicks `Crear` with an empty or whitespace-only input
- **THEN** the backend returns 400 Bad Request
- **AND** the ErrorBanner displays the validation error

### Requirement: Registration Page Route
Registration SHALL read `Registrarse`, `¿Ya tienes cuenta? Inicia sesión`, `Error en registro` (kept), `Formato de email inválido` for client validation.

#### Scenario: Spanish registration errors
- **WHEN** registration fails with 409 or invalid email
- **THEN** messages read `Este email ya está registrado` (backend body, kept) or `Formato de email inválido`

#### Scenario: User Navigates to Register Route
- **WHEN** user visits URL `/register` or clicks the register link from login page
- **THEN** system displays the registration form with email and password fields

#### Scenario: Successful Registration Triggers Auto-login Redirect
- **WHEN** user submits valid credentials via the register form
- **THEN** system calls POST /v1/auth/register directly
- **AND** upon 201 Created response, automatically calls POST /v1/auth/login with same credentials
- **AND** after receiving JWT token, navigates to `/tasks` page

#### Scenario: Registration Form Has Navigation Link to Login
- **WHEN** user is on the registration page and already has an account
- **THEN** system displays a link `¿Ya tienes cuenta? Inicia sesión` pointing to /login

### Requirement: Client-side Email Validation
Invalid format SHALL display `Formato de email inválido` via ErrorBanner on login, register and forgot-password.

#### Scenario: Invalid email blocked before submission
- **WHEN** user enters `mail@mail` or `notanemail`
- **THEN** the banner reads `Formato de email inválido` and no submit happens

#### Scenario: Valid email passes frontend validation
- **WHEN** user enters `usuario@dominio.com` in the login or register email field
- **THEN** the regex check passes and the form submits to the backend

#### Scenario: Empty email blocked by HTML5 required
- **WHEN** user submits the form with an empty email field
- **THEN** the HTML5 `required` attribute blocks submission

### Requirement: Frontend Password Reset Pages
Forgot/reset pages SHALL read `¿Olvidaste tu contraseña?`, `Enviar código`, `Continuar`, `Volver`, `Nueva/Confirmar contraseña`, `Guardar`/`Cancelar` equivalents, `Copiar/Copiado`, `No se pudo restablecer`, `Las contraseñas no coinciden`, `Si el email está registrado…`.

#### Scenario: Spanish reset flow
- **WHEN** user completes request → copy → verify → change
- **THEN** every visible string is Spanish, including mismatch and copy confirmation

#### Scenario: User requests password reset from login page
- **WHEN** user clicks the forgot-password link on the login page
- **THEN** system navigates to `/forgot-password`
- **AND** displays a form with email input and submit button

#### Scenario: User receives reset token and proceeds to reset
- **WHEN** user enters their email on the forgot password page
- **THEN** system displays the generated 6-character token with a copy action
- **AND** displays a `Continuar` link that navigates to `/reset/:token`

#### Scenario: User changes password via reset flow
- **WHEN** user navigates to `/reset/:token` with a valid token
- **THEN** system displays a form with new and confirm password inputs in Spanish
- **AND** upon successful submission, navigates the user to `/login`
