# Spec Delta

## ADDED Requirements

### Requirement: Paginated Board Loading
The board SHALL load tasks one page at a time through `TaskRepository.fetchPage(query, page, size)`, appending results and offering a "Cargar más" action while more pages remain (using the envelope's `total`). Any change to the query (search/sort/filter) SHALL reset to the first page. Manual ordering and optimistic updates from the current page SHALL keep working.

**ID**: REQ-FE-027
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — `fetchPage(query, page, size): Promise<Page<Task>>` in both adapters
- `frontend/src/services/ApiService.ts` — `getTasks(query, page, size)`
- `frontend/src/pages/TodoListPage.tsx` — page state + "Cargar más"

#### Scenario: Load more appends the next page
- **WHEN** the user has loaded the first page and more remain
- **THEN** "Cargar más" loads and appends the next page without dropping existing tasks

#### Scenario: Query change resets pagination
- **WHEN** the user changes the search, sort or a filter
- **THEN** the board reloads from page 0

#### Scenario: In-memory adapter pages too
- **WHEN** a test calls `fetchPage` on `InMemoryTaskRepository`
- **THEN** it returns the same page/`total` semantics without network
