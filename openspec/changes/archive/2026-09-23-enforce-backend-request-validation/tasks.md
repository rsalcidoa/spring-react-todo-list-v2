# Tasks

## 1. RegisterRequest: @NotBlank en password

- [x] 1.1 Añadir `@NotBlank(message = "Password must not be blank")` junto a `@Size(min=6)` en `com.example.todo.dto.RegisterRequest.password`. Verificar con `mvn compile` (backend/).

## 2. TaskController: @Valid en patchStatus

- [x] 2.1 Añadir `@Valid` al parámetro `StatusUpdateRequest request` en `TaskController.patchStatus()` (línea 113). Verificar con `mvn compile` (backend/).

## 3. Integration tests

- [x] 3.1 Extender `ErrorContractIntegrationTest` (o crear `ValidationIntegrationTest`) con:
    - (a) POST `/v1/auth/register` con `password: null` → 400 + `errors.password`.
    - (b) PATCH `/v1/tasks/{id}/status` con body `null` → 400 + `errors.status`.
    - (c) PATCH `{"status": ""}` → 400 + `errors.status`.
    - (d) PATCH `{"status": "INVALID"}` → 400 (IAE por `TaskStatus.valueOf("INVALID")`).
    - (e) PATCH `{"status": "ACTIVE"}` → 200 con task actualizado.
    Depende de 2.1. Verificar con `mvn test` (backend/).

## 4. Gate backend + frontend de regresión

- [x] 4.1 Gate backend completo (todos los tests). Depende de 3.1. Verificar con `mvn test` (backend/).
- [x] 4.2 Gate frontend de regresión (sin cambios esperados). Depende de 4.1. Verificar con `cd frontend && npx vitest run && npm run build`.
