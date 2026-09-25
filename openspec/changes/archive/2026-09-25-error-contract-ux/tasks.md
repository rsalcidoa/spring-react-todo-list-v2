# Tasks — One error contract end-to-end

## 1. Backend: bodies + filtro honesto + JwtUtil

- [x] 1.1 Dar body `{error: "Authentication required"}` al handler `Unauthenticated` y al entryPoint de `SecurityConfig`, y verificar `mvn -Dtest=GlobalExceptionHandlerTest test` en verde (actualizando asserts de vacío)
- [x] 1.2 Endurecer `JwtAuthenticationFilter` (solo invalidez declarada se ignora; resto propaga) + charset `UTF_8` en `JwtUtil`, con `JwtUtilTest` y tests del filtro nuevos, y verificar `mvn test` del módulo en verde
- [x] 1.3 Buscar tests que aserten 401 vacío y actualizarlos; correr suite completa `docker compose up -d && cd backend && mvn test` en verde

## 2. Frontend + cierre

- [x] 2.1 Migrar `ResetPasswordPage` a `mapApiError` (sin literales) y revisar `TAG_ERROR_FALLBACKS`, y verificar `npx vitest run && npm run build` en verde
- [x] 2.2 Sincronizar delta (`user-authentication`) con `openspec archive` (tras apply) y verificar `openspec validate --strict`
