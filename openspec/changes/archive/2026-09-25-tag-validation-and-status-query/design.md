# Design — Validación de tagNames + `?status` inválido estructurado

## Context

Ver `proposal.md` (Why). Estado actual: `TaskRequest.tagNames: Set<String>` (`TaskRequest.java:20`) sin constraints — `POST /v1/tasks {"tagNames":[""]}` persiste un `Tag("")` vía `TagService.resolve` (`TagService.java:61-82`); `TaskController.getAllTasks` (`TaskController.java:30`) bindea `Optional<TaskStatus>` y un valor inválido falla en conversión Spring con body genérico. Handler de validación en `GlobalExceptionHandler.java:53-63` agrupa por `fieldError.getField()`. Boot 3 + Hibernate Validator soportan container-element constraints (BV 2.0). Aplica después del cambio A (ambos tocan `TaskService.java`).

## Goals / Non-Goals

**Goals:** `tagNames` inválidos → `400` fail-fast con clave `tagNames`; `?status` inválido → mismo `400` estructurado que el resto del módulo de status.
**Non-Goals:** índice DB y 409 por agotamiento (cambio A); frontend (ya conforme); `patchStatus` muerto.

## Decisions

1. **Container-element constraints en el DTO** (vs validación manual en `TagService.resolve`). `@NotBlank + @Size(max=50)` por elemento falla antes de tocar DB/transacción, reusa el handler existente y cubre POST y PUT a la vez. Nulos cubiertos por `@NotBlank`; `"   "` rechazado por HV (trimma); `" Work "` pasa y el servicio lo normaliza. Oversize medido sin trim (aceptado, documentado). Mensajes: `"Tag name must not be blank"` / `"Tag name must not exceed 50 characters"` (estilo de los literales existentes).
2. **Colapsar `tagNames[i]` → `tagNames` en el handler** (vs fijar el shape con índices en la spec). Los paths de elementos (`tagNames[0]`) variarían por posición y romperían clientes; una normalización de 3 líneas en `handleValidation` mantiene el contrato limpio y estable. Sin cambios para el resto de campos.
3. **`status` como `String` + overload `getAllTasksByStatus(String)`** (vs `@ExceptionHandler(MethodArgumentTypeMismatchException)`). El controller queda delgado y el módulo Task posee todo el parsing de status (una sola operación, mismo mensaje literal ya fijado en spec), reutilizando `InvalidStatusValueException` + handler existentes sin código nuevo de mapeo. Se conserva o no el overload `(TaskStatus)` según conveniencia (detalle de implementación; el controller usará el de `String`). `"pending"` minúsculas → `400` estructurado (enum case-sensitive, consistente con POST/PUT).

## Risks / Trade-offs

- [HV no soportara container-elements en esta versión] → mitigación: cambia a validación manual en `resolve` lanzando `InvalidStatusValueException("tagNames", …)`; la spec no cambia (solo el mecanismo). Verificar con el primer test verde.
- [Tests existentes crean tasks con `tagNames` válidos] → no deberían romperse; si alguno usa blank, actualizarlo (era comportamiento basura).
- [**BREAKING** intencional: `tagNames` basura pasaba a `201`] → aceptado, alinea a REQ-TAG-005; frontend ya lo previene.

## Migration Plan

Sin migraciones. Deploy: revertible con revert del commit. Orden: aplicar cambio A primero.

## Test strategy

- MockMvc: `POST /v1/tasks {"tagNames":[""]}` → 400 `errors.tagNames`, sin task ni tag creados; elemento >50 → 400; `[" Work "]` → 201 reuse.
- MockMvc: `GET /v1/tasks?status=INVALID` → 400 shape exacto; `?status=PENDING` filtra; sin param → todas (tests existentes).
- Unit `GlobalExceptionHandlerTest`: paths `tagNames[0]` colapsan a `tagNames`.
- Gates: `docker compose up -d && cd backend && mvn test`.
