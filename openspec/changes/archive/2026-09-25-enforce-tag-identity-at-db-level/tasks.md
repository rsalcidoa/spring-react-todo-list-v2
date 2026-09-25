# Tasks — Enforce tag identity at DB level

## 1. Migración V4 con dedupe

- [x] 1.1 Escribir `backend/src/main/resources/db/migration/V4__tag_identity_ci.sql` (btrim defensivo, rewire `task_tags` al `MIN(id)` por `(user_id, lower(name))`, drop `uq_user_tag`, create unique index `uq_user_tag_ci`) y verificar que aplica en limpio con `docker compose up -d && cd backend && mvn test`
- [x] 1.2 Añadir test de migración (`TagIdentityMigrationTest`: invariantes post-V4 sin duplicados/huérfanos/sin-trim + enforcement del índice a nivel DB + mismo nombre entre usuarios OK) y verificar `mvn -Dtest=TagIdentityMigrationTest test` en verde

## 2. Entidad y agotamiento→409

- [x] 2.1 Quitar `uniqueConstraints` de `com.example.todo.model.Tag` (comentario → V4) y verificar `mvn test` en verde (validate no protesta)
- [x] 2.2 Cambiar `TaskService.createTask/updateTask` a lanzar `TagAlreadyExistsException` al agotar reintentos y verificar `mvn -Dtest=TaskServiceTest test` en verde (test de agotamiento existente actualizado a 409; cubre lo previsto para `TaskServiceRetryTest` sin archivo nuevo)

## 3. Regresión API + specs

- [x] 3.1 Añadir tests MockMvc (`POST /v1/tags` case-duplicado → 409 sin fila — ya existía; nuevo `POST /v1/tasks` case-variante reusa con 201 y una sola fila) y verificar `mvn test` completo en verde (99/99)
- [x] 3.2 Sincronizar delta `tagging` a specs principales con `openspec archive` (tras apply) y verificar `openspec validate --strict`
