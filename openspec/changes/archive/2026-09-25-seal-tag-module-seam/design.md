# Design — Seal the tag module seam

## Context

Ver `proposal.md` (Why). Estado: `TagService.resolve:61-82` retorna `List<Tag>` (entidad con `user` LAZY) mientras `list:29-36`/`create:38-53` retornan `TagResponse`; `exists:84-91` y `resolve:63-65` cargan `findByUserId` completa y comparan en memoria; el retry transaccional vive en `TaskService:66-101` (`TransactionTemplate` + `MAX_ATTEMPTS`), y `create` mapea violación→409 pero `resolve` guarda sin `try/catch`. `assignTags:129-133` consume entidades.

## Goals / Non-Goals

**Goals:** retry dentro del módulo Tag; ninguna entidad cruza la seam; lookup case-insensitive en DB en vez de scan en memoria.
**Non-Goals:** cambiar V4; tocar controller/HTTP; segundo adapter de persistencia.

## Decisions

1. **Retry dirigido desde el borde exterior, `resolve` idempotente** (vs try/catch dentro de `resolve`). Con JPA, `save()` no hace flush: la violación solo aflora en el commit, y un flush fallido marcaría la tx como rollback-only, envenenando cualquier reintento dentro de la misma tx. Por eso el bucle de `TaskService` (tx fresca por intento + `resolve` que re-consulta todo en cada llamada) es el driver correcto; `resolve` no captura nada y es seguro bajo reintento. Lo que sí se mueve al módulo: lookups case-insensitive por query y retorno por valor, de modo que el caller no implementa NADA específico de tags salvo el bucle genérico (que el cambio D colapsa a helper).
2. **Retorno por valor (`TagResponse` o record interno id+name)** (vs entidad). `assignTags` asocia por id/objeto adjunto sin exponer `Tag` fuera del módulo; `Task.getTags()` sigue siendo colección de entidades *dentro* de persistencia, pero ningún caller la recorre (hoy `toResponse` mapea `t.getId/getName` — se mantiene).
3. **Query case-insensitive en `TagRepository`** (vs scan en memoria). `findByUserIdAndNameIgnoreCase` o `@Query lower()`; `exists` y el batch de `resolve` lo usan. N+1 lógico actual (una carga completa + saves individuales) se mantiene en forma pero acotado; batch real opcional si el diff lo permite sin crecer.
4. **Sin fake de persistencia**. Un segundo adapter solo para simetría sería seam hipotética; la garantía del índice sigue cubierta por `TagIdentityMigrationTest` + MockMvc.

## Risks / Trade-offs

- [`resolve` transaccional + reintento del caller] → `resolve` es idempotente y re-consulta fresco en cada llamada, así que el bucle exterior con tx fresca reusa al ganador; `resolve` nunca abre tx propia (evita huérfanos, REQ-TAG-002). Cubierto por test de reintento a nivel `TaskService` (ya existe) + normalización a nivel `TagService`.
- [Cambio de firma `resolve`] → toca `assignTags` y sus tests; superficie pequeña y localizada.
- [Orden con D] → B primero; D adapta el helper de retry de task sobre lo que B deje.

## Migration Plan

Sin migraciones. Rollback: revert. Orden: B antes que D.

## Test strategy

- `TagServiceTest`: identidad (trim/case/dedupe), retry interno (violación → reuse/409), nunca-entidad (aserción sobre tipo retornado, no `times(findByUserId)`).
- Integración existente (`TagResolutionIntegrationTest`, `TagIdentityMigrationTest`) en verde sin cambios salvo firma.
- Gates: `docker compose up -d && cd backend && mvn test`.
