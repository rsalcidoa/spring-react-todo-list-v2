# Tasks

## 1. Flyway Migration Infrastructure

- [x] 1.1 Add flyway-core dependency to pom.xml and verify Maven compiles cleanly (`mvn compile -q`)
- [x] 1.2 Create `db/migration/V1__init.sql` with current schema DDL (users table, tasks table, relationships) and verify Flyway validates the baseline (`mvn flyway:validate`)
- [x] 1.3 Update `application.properties`: set `spring.jpa.hibernate.ddl-auto=validate`, configure Flyway locations (`db/migration`), remove any auto-ddl settings

## 2. V2 Migration — Status Field and Tag Tables

- [x] 2.1 Create `db/migration/V2__add_status_and_tags.sql` with: ALTER TABLE tasks ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'PENDING'; CREATE TABLE tags (id, name, user_id, UNIQUE constraint); CREATE TABLE task_tags junction table with foreign keys and CASCADE delete; UPDATE tasks SET status = PENDING WHERE status IS NULL
- [x] 2.2 Run Flyway migrate and verify schema changes via psql (check columns and tables exist)

## 3. Backend — Entity Layer

- [x] 3.1 Create `model/TaskStatus.java` enum with PENDING, ACTIVE, COMPLETED values (`mvn compile -q`)
- [x] 3.2 Create `model/Tag.java` entity with @Id Long id, @Column String name, @ManyToOne User user, and @Table(uniqueConstraints = UNIQUE(user_id, name))
- [x] 3.3 Modify `model/Task.java`: add @Enumerated TaskStatus status (default PENDING in constructor), add @ManyToMany Set<Tag> tags with join table mapping; update toString/debug output

## 4. Backend — DTO Layer

- [x] 4.1 Update `dto/TaskRequest.java`: add optional TaskStatus status field, add optional Set<String> tagNames field
- [x] 4.2 Update `dto/TaskResponse.java`: add TaskStatus status field (getter/setter), add List<String> tags field (getter/setter)

## 5. Backend — Repository Layer

- [x] 5.1 Modify `repository/TaskRepository.java`: add method `List<Task> findByUserAndStatus(User user, TaskStatus status)`; verify compile (`mvn compile -q`)
- [x] 5.2 Create `repository/TagRepository.java` with findAllByUser(user), findByNameAndUser(name, user), save methods; verify compile

## 6. Backend — Service Layer

- [x] 6.1 Update `service/TaskService.createTask()`: set default status to PENDING if not provided; resolve tagNames (create tags on-the-fly if missing per-user); save task with tags assigned
- [x] 6.2 Update `service/TaskService.updateTask()`: conditionally update status if provided; replace all existing tags with new tagNames list when present; remove all tags when empty array sent
- [x] 6.3 Add helper method for tag resolution (find or create per-user) and verify compile (`mvn compile -q`)

## 7. Backend — Controller Layer

- [x] 7.1 Modify `controller/TaskController.java`: accept optional status + tagNames in POST body; add Optional `@RequestParam(status)` filter on GET for column isolation
- [x] 7.2 Create `controller/TagController.java` with endpoints: GET `/v1/tags` (list user's tags, sorted alphabetically), POST `/v1/tags` (create tag per-user), DELETE `/v1/tags/{id}` (delete + cascade unassign from tasks)
- [x] 7.3 Run backend integration test (`mvn test -Dtest=TaskCrudIntegrationTest`) and verify it passes with updated JSON payloads including status

## 8. Frontend — Design System and Shared Types

- [x] 8.1 Create `frontend/src/styles/theme.css` with Inter font @import (Google Fonts CDN), CSS custom properties for all colors (--color-bg, --color-surface, --primary, etc.), typography defaults (--radius, --shadow-sm)
- [x] 8.2 Create `frontend/frontend/src/services/types/task.ts` with TypeScript interfaces: Tag {id, name}, Task {...includes status, tags, priority}, TaskStatus, Priority, ColumnName type aliases
- [x] 8.3 Install `@dnd-kit/core`, `@dnd-kit/sortable`, and verify npm installs cleanly (`npm install --prefix frontend @dnd-kit/core @dnd-kit/sortable && cd frontend && npm run build -q`)

## 9. Frontend — API Service Layer

- [x] 9.1 Update `frontend/src/services/ApiService.ts`: add status + tagNames to create/update request type signatures; add getTags(), createTag(name), deleteTag(id) exports for new endpoints
- [x] 9.2 Verify TypeScript compiles without errors (`cd frontend && npx tsc --noEmit -q`)

## 10. Frontend — Kanban Components

- [x] 10.1 Create `frontend/src/components/KanbanCard.tsx` with Draggable wrapper (dnd-kit), rendering title (bold), description (muted text), priority badge (color-coded by HIGH=red, MEDIUM=amber, LOW=gray), due date pill, tag pills; click opens edit modal
- [x] 10.2 Create `frontend/src/components/KanbanColumn.tsx` with Droppable wrapper (dnd-kit), colored header showing status name + count badge, drop zone that highlights on drag-over, renders KanbanCard children; on drop calls update API with new status
- [x] 10.3 Create `frontend/src/components/AddTaskModal.tsx` as overlay modal: title input (required), description textarea, Priority select dropdown, Status select dropdown (PENDING/ACTIVE/COMPLETED), Tags dropdown showing existing user tags plus ability to create new tag inline, Due date picker; Save/Cancel buttons

## 11. Frontend — Page Redesigns

- [x] 11.1 Rewrite `frontend/src/pages/TodoListPage.tsx` as Kanban board layout: sidebar (tag filters, priority count badges, + Task button), three KanbanColumn children grouped by status, AddTaskModal integration for create/edit; fetch tasks once on mount and group locally
- [x] 11.2 Create `frontend/src/pages/TodoListPage.module.css` with CSS modules classes for the board layout (sidebar width, column flex layouts, spacing)
- [x] 11.3 Redesign `frontend/src/pages/LoginPage.tsx` using theme classes: centered card layout, Inter font styling, primary color submit button, clean input fields; verify visually matches new design system
- [x] 11.4 Redesign `frontend/src/pages/RegisterPage.tsx` with same visual treatment as LoginPage for consistency; verify both auth pages share identical layout patterns

## 12. Frontend — Integration and Tests

- [x] 12.1 Update `frontend/src/__tests__/TodoListPage.test.tsx`: replace inline-editing tests with Kanban column rendering test (verify three columns render), drag-and-drop state transition test (drag card from Todo to In Progress → verify PUT call with status=ACTIVE), modal create flow test
- [x] 12.2 Update `frontend/src/__tests__/LoginPage.test.tsx`: adjust selector queries for new theme-based structure (no structural changes, only class name updates)
- [x] 12.3 Verify all frontend tests pass (`cd frontend && npm test`) and production build succeeds (`npm run build -q`)

## 13. End-to-End Verification

- [x] 13.1 Start Docker Compose PostgreSQL (`docker compose up -d`), start backend (mvn spring-boot:run)
- [x] 13.2 Run full-stack smoke test: register user → login → create task with status=PENDING and tag "Work" → verify appears in To Do column → drag to In Progress → verify status=ACTIVE → delete → verify gone
- [x] 13.3 Verify Flyway migration log on startup shows V1 applied, V2 applied, no validation errors
