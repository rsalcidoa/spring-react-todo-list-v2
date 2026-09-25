# Tasks — Validación de tagNames + `?status` inválido estructurado

## 1. Elementos de tagNames → 400 (requiere cambio A aplicado)

- [x] 1.1 Añadir element constraints a `TaskRequest.tagNames` (`@NotBlank` + `@Size(max=50)` con mensajes de la spec) y verificar `POST /v1/tasks {"tagNames":[""]}` → 400 `errors.tagNames` sin crear task ni tags
- [x] 1.2 Colapsar paths `tagNames[i]` a clave `tagNames` en `GlobalExceptionHandler.handleValidation` y verificar unit `GlobalExceptionHandlerTest` + elemento >50 chars → 400 con clave `tagNames`
- [x] 1.3 Verificar `[" Work "]` → 201 con reuse (sin duplicado; test preexistente `createTaskWithPaddedTagNameReusesExistingWorkTag`) y `mvn test` completo en verde

## 2. Query ?status inválido → 400 estructurado

- [x] 2.1 Cambiar `TaskController.getAllTasks` a `Optional<String>` + overload `TaskService.getAllTasksByStatus(String)` vía `parseStatus`, y verificar `GET /v1/tasks?status=INVALID` → 400 `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`
- [x] 2.2 Verificar `?status=PENDING` filtra, sin param devuelve todas (nuevo test `statusQueryFiltersAndAbsentParamReturnsAll`; `mvn test` 104/104 en verde)

## 3. Specs

- [x] 3.1 Sincronizar deltas (`backend-validation`, `task-status`, `task-management`) con `openspec archive` (tras apply) y verificar `openspec validate --strict`
