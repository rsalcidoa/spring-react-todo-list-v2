# Proposal

## Why

The current task management UI is a basic list with inline editing, no visual hierarchy, filtering, or drag-and-drop capability. Users cannot organize tasks by workflow stage, categorize them via tags, or quickly scan priorities across columns. The backend also lacks the status field and tagging system needed to support this level of organization.

## What Changes

- **Add `status` field** (`PENDING / ACTIVE / COMPLETED`) to Task entity with default value `PENDING`. No breaking changes — existing API clients omitting `status` will see tasks defaulting to PENDING.
- **Add user-scoped tagging system**: new Tag entity (Many-to-Many via task_tags junction table). Tags are scoped per-user; each tag name is unique within a user's scope.
- **Redesign frontend as Kanban board**: three-column layout with drag-and-drop task card transitions between columns, CSS Modules + custom properties theme (no new styling dependencies), Inter font from Google Fonts, `@dnd-kit` for drag-and-drop.
- **Add Flyway migrations** to replace JPA auto-ddl for schema management.
- **Redesign auth pages** (Login / Register) with the same visual design system.

## Capabilities

### New Capabilities
- `task-status`: Kanban board task lifecycle management via status field and drag-and-drop transitions between PENDING, ACTIVE, and COMPLETED states. Includes column filtering by status and optimistic UI updates on drag events.
- `tagging`: User-scoped tag creation and assignment to tasks. Supports per-user tag CRUD (CRUD), multiple tags per task, and dropdown-based tag selection in the task creation/edit modal.

### Modified Capabilities
- `task-management`: Adds status field and tag association to existing CRUD operations. GET `/v1/tasks` supports optional `?status=` query parameter filtering for column isolation. Create/Update accept optional `status` (defaults PENDING if omitted) and `tagNames[]`. No BREAKING changes — all new fields are optional for backward compatibility with existing clients.

## Impact

**Backend modules affected:** `com.example.todo.model`, `com.example.todo.repository`, `com.example.todo.service`, `com.example.todo.controller`, `com.example.dto`
- 10 files: Task.java (modified), Tag.java (new), TaskStatus.java (new), TaskRequest.java, TaskResponse.java, TaskRepository.java, TaskService.java, TaskController.java, TagController.java (new), TagRepository.java (new)

**Frontend modules affected:** 9 files
- theme.css (new), TodoListPage.tsx (rewrite), KanbanColumn.tsx (new), KanbanCard.tsx (new), AddTaskModal.tsx (new), ApiService.ts (modified), types/task.ts (new), LoginPage.tsx, RegisterPage.tsx

**API changes:** 
- POST/PUT `/v1/tasks` accept optional `status` and `tagNames` fields
- GET `/v1/tasks` supports optional `?status=PENDING|ACTIVE|COMPLETED` filter param
- NEW: GET/POST/DELETE `/v1/tags` for user-scoped tag CRUD

**Dependencies added:** `org.flywaydb:flyway-core`, `@dnd-kit/core`, `@dnd-kit/sortable`, Inter font (Google Fonts CDN)

## Non-goals

No search across task titles/descriptions. No multi-user collaboration or sharing features. No notification system for due date reminders. No CSV/Excel export or import. No mobile app — responsive web only.

## Rollback Plan

Revert the Git commit(s). Flyway migrations are reversible via a V3 migration that drops `tags` and `task_tags` tables and removes the `status` column from tasks. JPA validate mode prevents accidental schema drift. Since all new API fields default gracefully (PENDING status, empty tags), existing clients remain compatible without requiring changes.
