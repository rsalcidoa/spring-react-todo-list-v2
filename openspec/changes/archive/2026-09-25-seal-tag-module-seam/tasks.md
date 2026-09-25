# Tasks — Seal the tag module seam

## 1. Repository + módulo (sin tocar callers)

- [x] 1.1 Añadir lookup case-insensitive a `TagRepository` y usarlo en `exists`/`resolve`, y verificar `mvn -Dtest=TagServiceTest test` en verde
- [x] 1.2 Mover el retry dentro de `TagService.resolve` (misma política que `create`) y cambiar su retorno a valores sin entidad, y verificar unit de retry (violación → reuse/409) en verde

## 2. Callers + regresión

- [x] 2.1 Adaptar `TaskService.assignTags` a la nueva firma preservando atomicidad task+tags (retry interno participa de la tx del caller) y verificar `mvn test` completo en verde
- [x] 2.2 Actualizar `TagServiceTest` (contrato de identidad, no implementación) y archivar con `openspec archive`
