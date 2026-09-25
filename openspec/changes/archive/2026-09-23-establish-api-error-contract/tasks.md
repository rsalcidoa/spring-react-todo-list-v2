# Tasks

## 1. Backend: excepción 409 + protección de carrera

- [x] 1.1 Crear `com.example.todo.exception.UserAlreadyExistsException` (runtime, extends `RuntimeException`) en `backend/`. Verificar con `mvn compile` (backend/).
- [x] 1.2 Modificar `com.example.todo.service.UserService.register()`: lanzar `UserAlreadyExistsException` en pre-check `existsByEmail`; envolver `userRepository.save(user)` en try-catch `DataIntegrityViolationException` → re-lanzar `UserAlreadyExistsException`. Verificar con `mvn compile` (backend/).

## 2. Backend: GlobalExceptionHandler extendido (409 + 400)

- [x] 2.1 Extender `GlobalExceptionHandler` con `@ExceptionHandler(UserAlreadyExistsException)` → 409 `{"error":"Este email ya está registrado"}` y `@ExceptionHandler(MethodArgumentNotValidException)` → 400 `{"error":"Validation failed","errors":{<campo>:[mensajes]}}` (agrupar `getFieldErrors()` por campo). Depende de 1.1. Verificar con `mvn compile` (backend/).
- [x] 2.2 Extender `GlobalExceptionHandlerTest` con asertos unitarios: instancia directa, `UserAlreadyExistsException` → 409 + body; `MethodArgumentNotValidException` (mock de `MethodInvocationException` con errors en `password` y `email`) → 400 + `{"errors":{"password":[...], "email":[...]}}`. Depende de 2.1. Verificar con `mvn test -Dtest=GlobalExceptionHandlerTest` (backend/).

## 3. Integration tests + gate

- [x] 3.1 Crear `ErrorContractIntegrationTest` (`@SpringBootTest` + `@AutoConfigureMockMvc`, patrón `TaskCrudIntegrationTest`): registrar usuario A; re-registrar A → 409 + `{"error":"Este email ya está registrado"}`; registrar con password `<6` → 400 + `errors.password`; registrar con email `invalid` → 400 + `errors.email`; login con email vacío → 400 + `errors.email`; crear task con `dueDate:"2024-12-31"` → 201 + eco `2024-12-31`. Depende de 2.2. Verificar con `mvn test -Dtest=ErrorContractIntegrationTest` (backend/).
- [x] 3.2 Gate backend completo (debe seguir verde `TaskCrudIntegrationTest`, `GlobalExceptionHandlerTest`, y `ErrorContractIntegrationTest`). Depende de 3.1. Verificar con `mvn test` (backend/).
- [x] 3.3 Gate frontend de regresión (sin cambios esperados). Depende de 3.2. Verificar con `cd frontend && npx vitest run && npm run build`.
