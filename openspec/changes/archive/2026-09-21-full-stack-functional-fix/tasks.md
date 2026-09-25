# Tasks — Full Stack Functional Fix

## 1. Infrastructure Setup (PostgreSQL + Docker)

- [x] 1.1 Create `docker-compose.yml` at project root with PostgreSQL service: image `postgres:16-alpine`, container name `todo-postgres`, env vars `POSTGRES_DB=todo_db`, `POSTGRES_USER=todo`, `POSTGRES_PASSWORD=todo123`, expose port 5432, healthcheck via `pg_isready`
- [x] 1.2 Create `.env.example` with documented variables: `DB_URL=jdbc:postgresql://localhost:5432/todo_db`, `DB_USER=todo`, `DB_PASSWORD=todo123`, `JWT_SECRET` (with hint of minimum length)

## 2. Backend — Database Migration (H2 → PostgreSQL) ⚠ depends on: 1.1, 1.2

- [x] 2.1 Update backend/pom.xml: replace `<dependency>com.h2database:h2</dependency>` with `<dependency>org.postgresql:postgresql:<version></dependency>`; verify `mvn dependency:resolve` succeeds
- [x] 2.2 Update application.properties: change `spring.datasource.url=jdbc:h2:mem:testdb` to `${DB_URL:jdbc:postgresql://localhost:5432/todo_db}`; change driver to `${DB_DRIVER:org.postgresql.Driver}`; keep H2 console disabled in prod
- [x] 2.3 Verify backend starts and connects to PostgreSQL via `mvn spring-boot:run`; check table creation and schema migration

## 3. Backend — JWT Secret as Environment Variable ⚠ depends on: 1.2

- [x] 3.1 Update application.properties line `todo.security.jwt.secret=super-secret-key-for-testing...` → `${JWT_SECRET:spring-boot-starter-security-jwt-secret-key-that-is-at-least-64-bytes-long}`; ensure default fallback is ≥ 32 bytes random
- [x] 3.2 Verify `mvn compile` succeeds and JWT token generation works with the new secret (check JwtUtil.java doesn't assume fixed-length key)

## 4. Backend — CORS Production Fix ⚠ depends on: none

- [x] 4.1 Update SecurityConfig.java line 73: change `Arrays.asList("*")` to `List.of("http://localhost:5173")` in allowedOrigins; or use `${FRONTEND_URL:http://localhost:5173}` for configurability
- [x] 4.2 Verify CORS headers with curl preflight: `curl -X OPTIONS http://localhost:8080/v1/tasks -H "Origin: http://localhost:5173" -v` → expect Access-Control-Allow-Origin = http://localhost:5173

## 5. Backend — Bean Validation on DTOs ⚠ depends on: none (but requires backend running)

- [x] 5.1 Add to `RegisterRequest.java`: `@NotBlank(message="Email must not be blank") @Email(message="Must be a valid email address")` on private String email; add `@Size(min=6, message="Password must be at least 6 characters long")` on private String password
- [x] 5.2 Add to `LoginRequest.java`: same annotations — `@NotBlank @Email` on email; `@NotBlank` on password (no min-length check needed since BCrypt handles any length)
- [x] 5.3 Add to `TaskRequest.java`: `@NotBlank(message="Title must not be blank") @Size(max=255)` on private String title

## 6. Backend — Controller Validation Activation ⚠ depends on: 5, 4 (to keep CORS working)

- [x] 6.1 Update `AuthController.register()`: add `@Valid` before `@RequestBody RegisterRequest request`
- [x] 6.2 Update `AuthController.login()`: add `@Valid` before `@RequestBody LoginRequest request`
- [x] 6.3 Update `TaskController.createTask()` and `.updateTask()`: add `@Valid` before each `@RequestBody TaskRequest request` parameter
- [x] 6.4 Verify: run `curl -X POST http://localhost:8080/v1/auth/register -H "Content-Type: application/json" -d '{"email":"","password":"123"}'`; expect 400 Bad Request with JSON error details for both fields

## 7. Frontend — Axios Interceptor (Authorization Header) ⚠ depends on: none

- [x] 7.1 Refactor `frontend/src/services/ApiService.ts`: replace bare `axios` import with custom instance created via `axios.create({ baseURL: '/v1' })`; add request interceptor that reads `localStorage.getItem('jwt')` and sets `config.headers.Authorization = \`Bearer ${token}\``
- [x] 7.2 Add response error interceptor that catches `status === 401`, clears `localStorage.removeItem('jwt')` + `removeItem('email')`, redirects to `/login` via `window.location.href = '/login'` (or React Router `useNavigate` in a higher-level component)
- [x] 7.3 Export the configured api instance for re-use by all ApiService functions

## 8. Frontend — Register Page Fix + Route ⚠ depends on: 7, 6 (backend running with validation active)

- [x] 8.1 Update `RegisterPage.tsx`: import `registerUser` from AuthService; change `auth.login(email,password)` in onSubmit to `try { await registerUser(email,password); auth.login(email,password); navigate('/tasks'); } catch(e) { alert('Error en registro') }`
- [x] 8.2 Add navigation link from RegisterPage to /login: "¿Ya tienes cuenta? Iniciar sesión" → Link component pointing to `/login`
- [x] 8.3 Add `<Route path="/register" element={<RegisterPage />} />` in `App.tsx` before the catch-all route `path="/*"`
- [x] 8.4 Update `LoginPage.tsx`: add link "¿No tienes cuenta? Registrarse" → Link to `/register`

## 9. Frontend — Cleanup ⚠ depends on: none

- [x] 9.1 Delete duplicate vite config file (either `vite.config.js` or `vite.config.ts`) — keep only one; verify `npm run build` succeeds
- [x] Optional cleanup of unused MUI dependencies from package.json (@mui/material, @emotion/react, @emotion/styled); removed dependencies and updated config.

## 10. Verification — Integration Tests and End-to-End Flow ⚠ depends on: all above tasks

- [x] 10.1 Run backend integration tests: `mvn test -Dtest=ApiIntegrationTests,TaskCrudIntegrationTest`; verify all pass (register/login flow with validation errors returning 400)
- [x] Run frontend unit tests: `npm run build` (Vite type-check); verify no TypeScript compilation errors in ApiService.ts, RegisterPage.tsx, App.tsx, LoginPage.tsx
- [x] Manual end-to-end flow check: start backend (`mvn spring-boot:run`), start frontend (`npm run dev`), open http://localhost:5173/register → register a new user → auto-login and navigate to /tasks → create/edit/delete tasks → verify all API calls succeed (201/200) vs previous 401 failures
- [x] 10.4 Verify PostgreSQL persistence: stop backend, restart, confirm existing users and tasks are still present in the database (`docker exec -it todo-postgres psql -U todo -d todo_db -c "SELECT * FROM users;"`)

## Dependencies Summary

```
[1] Infrastructure → [2] DB Migration, [3] JWT env var, [4] CORS, [5] Validation DTOs
[5] Validation DTOs → [6] Controller @Valid annotations
[7] Axios interceptor → [8] Register page fix (api calls now include auth)
[8] Register fix + route → [10] E2E verification
[9] Cleanup — independent of other tasks, can run anytime
```

**Order of execution**: 1 → 2/3/4/5 in parallel → 6 depends on 5 → 7 (independent) → 8 depends on 7+6 → 9 (any time) → 10 last.
