# Design

## Context

The current codebase has a minimal task list UI (`TodoListPage.tsx`) with inline editing and no structure beyond `<div>` elements with inline styles. The backend uses Spring Boot 3.2.4 + Java 21, PostgreSQL via Docker, JPA auto-ddl for schema management, and JWT-based authentication. Tests exist but are fragile (inline-editing mock patterns in `TodoListPage.test.tsx`).

The change touches both layers simultaneously: new database columns/tables require Flyway migrations, new API endpoints need backend service/controller changes, and the frontend must consume these with a completely rewritten UI.

## Goals / Non-Goals

**Goals:**
- Deliver a three-column Kanban board (To Do → In Progress → Done) driven by `status` field transitions via drag-and-drop.
- Add user-scoped tagging system with Many-to-Many relationship and dropdown-based assignment in the task form.
- Replace inline styles with CSS Modules + custom properties for themable, maintainable styling.
- Introduce Flyway migrations as the sole schema management mechanism.
- Redesign Login/Register pages to match the new design system for visual consistency.

**Non-Goals:**
- Search across task content (title, description).
- Multi-user collaboration or shared boards.
- Email/SMS notifications for due date reminders.
- Data import/export (CSV/Excel).
- Native mobile app — responsive web only.

## Decisions

### Decision 1: CSS Modules + Custom Properties (no styling framework)
**Choice:** Use Vite's built-in CSS modules (`*.module.css`) with a global `theme.css` containing custom properties for colors, spacing, and typography tokens. No external CSS framework or styled-components dependency.

**Alternatives considered:**
- Tailwind CSS — faster prototyping but adds a large build dependency; class sprawl in Kanban cards makes JSX harder to read.
- Radix UI + styled-components — accessible primitives out of the box but bundles ~20KB extra and couples us to a React component library.

**Rationale:** The project's constraint is "lightweight, no new styling dependencies." CSS modules give full control with zero added build complexity. Inter font loads via Google Fonts CDN (`@import` in theme.css). Token system means changing the entire palette requires editing only one file.

### Decision 2: Native HTML5 Drag and Drop for drag-and-drop
**Choice:** Use native HTML5 `draggable` attribute with onDragStart/onDrop event handlers for cross-column card drops. No additional library dependency required.

**Alternatives considered:**
- `@dnd-kit/core` + `@dnd-kit/sortable` — modern, tree-shakeable API with touch support and sortable components; added ~8KB gzipped bundle impact but not needed since cross-column drag-and-drop is sufficient (intra-column sorting determined by priority).

**Rationale:** Native HTML5 DnD handles the required use case (drag cards between columns) without extra dependencies. Sorting within columns is already determined by task priority, so sortable reordering adds no value. This eliminates 2 npm packages and reduces bundle size while keeping cross-browser compatibility for the three-column Kanban layout.

### Decision 3: Flyway for schema migrations
**Choice:** Replace `spring.jpa.hibernate.ddl-auto=update` with Flyway (`flyway-core`) and manage all schema changes through versioned SQL migration scripts in `db/migration/`.

**Alternatives considered:**
- JPA auto-ddl — convenient for rapid prototyping but causes accidental schema drift, makes rollback unpredictable, and doesn't work well in team environments.
- Liquibase — XML/YAML-based changelog; more feature-rich than Flyway but slower boot times due to XML parsing and harder to read.

**Rationale:** Flyway is the simplest migration tool — versioned SQL files, fast boot, clear V1/V2 convention. The existing schema (tables: `users`, `tasks`) maps cleanly to `V1__init.sql`. New columns/tables become `V2__add_status_and_tags.sql`.

### Decision 4: Status defaults to PENDING on creation
**Choice:** When the API receives a create request without an explicit `status` field, the backend defaults to PENDING. This preserves backward compatibility — existing clients that never send status will continue working unchanged.

**Rationale:** Zero breaking changes for any client that doesn't yet use status. The frontend explicitly sends status on all create/update requests after this change, so the default is only a safety net.

### Decision 5: Tags created on-the-fly during task creation
**Choice:** When `tagNames[]` includes a name not found in the user's tag scope, the service creates it automatically rather than rejecting with "unknown tag."

**Rationale:** Matches the UX of many productivity apps (Notion, Linear). Users can type new category names directly into the task form without needing to manage tags separately first. The dropdown shows existing tags; if none match or the desired tag isn't listed, they create it inline during task creation.

### Decision 6: Kanban column filtering via API status query param
**Choice:** The frontend fetches all tasks once and groups them locally by `status` for rendering columns. For optimization, GET requests support `?status=` but the primary UX pattern is a single fetch + client-side grouping.

**Rationale:** A single `GET /v1/tasks` call loads all data needed for the full board view. Filtering per column happens in JavaScript (`.filter(task => task.status === 'PENDING')`). If performance becomes an issue, the API supports per-column filtered requests as a fallback without changing the frontend architecture.

## Risks / Trade-offs

[Risk: dnd-kit learning curve] → Mitigation: The component API is minimal — `Droppable` wrapper around column content with `onDropEnd` handler. Most of the logic (status transition) lives in the event handler, not in dnd-kit itself. Start with basic drag support; sortable reordering can be added later if needed.

[Risk: Flyway V1 recreates existing schema] → Mitigation: V1 will contain the exact DDL for current tables (`users`, `tasks`). Since no data exists yet (this is a development project), there's zero migration complexity. If data existed, we'd need an initial_data.sql script after V1.

[Risk: Backend Java 21 + Flyway version compatibility] → Mitigation: Use `flyway-core` 9.x which supports Spring Boot 3.x and Java 17/21 natively. No compatibility issues expected.

[Risk: CSS Modules require explicit className mapping in JSX] → Mitigation: Each component imports its module as `import styles from './Component.module.css'`. The mapping is explicit at the top of each file, making it easy to find which class does what. This trades a tiny bit of verbosity for better tooling support (CSS linting, autocomplete).

[Risk: Tag resolution adds latency on task create/update] → Mitigation: Tag lookup and creation are sequential within a single transaction (the JPA `@Transactional` method wraps both operations). For typical tag lists (1–5 per task), the N+1 lookups add ~5ms at most. If tags become a performance concern later, batch queries can replace individual lookups.

## Migration Plan

**Step 1: Add Flyway dependency and migration infrastructure.**
- Update `pom.xml`: add `org.flywaydb:flyway-core` (scope `runtime`).
- Create `db/migration/V1__init.sql` with current schema DDL (`users`, `tasks`).
- Change `application.properties`: set `spring.jpa.hibernate.ddl-auto=validate`, set Flyway paths.

**Step 2: Add V2 migration — new columns and tables.**
- Create `db/migration/V2__add_status_and_tags.sql` (ALTER TABLE tasks ADD COLUMN status, CREATE TABLE tags, CREATE TABLE task_tags).
- Run Flyway migrate; verify schema matches expectations via psql or Docker exec.

**Step 3: Backend entity and DTO updates.**
- Add `TaskStatus.java` enum + modify `Task.java` with status field (default PENDING) and @ManyToMany tags collection.
- Update DTOs (`TaskRequest`, `TaskResponse`) to include status + tag fields.

**Step 4: Backend service/repository/controller updates.**
- Add new repository methods, update TaskService for status/tag handling.
- Create TagController; modify TaskController to accept status + tagNames fields.

**Step 5: Frontend design system and types.**
- Write `theme.css` with Inter font import + CSS custom properties.
- Create shared TypeScript types (`types/task.ts`).
- Update ApiService with new API signatures.

**Step 6: Frontend Kanban components.**
- Build KanbanColumn, KanbanCard, AddTaskModal components with dnd-kit integration.
- Rewrite TodoListPage as the board layout container.

**Step 7: Auth pages redesign.**
- Apply theme classes to LoginPage and RegisterPage for visual consistency.

## Open Questions

None at this time — all design decisions were resolved during exploration (status defaults, tag creation behavior, drag transitions, sorting order). Each decision was recorded in the Decisions section above with alternatives considered.
