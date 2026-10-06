# Tasks

> Skills: `tdd` en cada tarea funcional; `codebase-design` al fijar el seam `TokenService`.

## 1. Backend — emision de refresh tokens (TDD)

- [ ] 1.1 (red) `TokenServiceTest` que falle: emite token opaco y guarda solo el hash; login devuelve `{token, refreshToken}`; verificar `mvn -Dtest=TokenServiceTest test` (rojo). Skills: `tdd`.
- [ ] 1.2 Crear `RefreshToken`, `RefreshTokenRepository`, `TokenService`, `RefreshRequest`/`TokenPairResponse`, migracion `V11`, y cambiar `AuthController.login` para devolver el par; verificar `mvn -Dtest=TokenServiceTest test` (verde). Skills: `tdd`, `codebase-design`.

## 2. Backend — refresh y rotacion (TDD)

- [ ] 2.1 (red) Test que falle: refresh valido rota (revoca el viejo), expirado/desconocido -> 401, reuso revoca la familia; verificar `mvn -Dtest=TokenServiceTest test` (rojo). Skills: `tdd`.
- [ ] 2.2 Implementar `POST /v1/auth/refresh` con rotacion y deteccion de reuso; verificar `mvn -Dtest=TokenServiceTest,AuthControllerTest test` (verde). Skills: `tdd`.
- [ ] 2.3 Integracion: login -> refresh -> pair nuevo; reuso -> 401; verificar `mvn -Dtest=RefreshApiIntegrationTest test`.

## 3. Frontend (TDD)

- [ ] 3.1 (red) `session.test.ts` que falle: guarda/limpia access+refresh; verificar `npx vitest run src/__tests__/session.test.ts` (rojo). Skills: `tdd`.
- [ ] 3.2 Extender `session.ts` y `AuthContext` para persistir el refresh token; verificar `npx vitest run src/__tests__/session.test.ts src/__tests__/AuthContext.test.tsx` (verde). Skills: `tdd`.
- [ ] 3.3 (red) `ApiService.test.ts` que falle: 401 -> un solo refresh single-flight -> retry; refresh fallido -> clear + redirect; login no se refresca; verificar `npx vitest run src/__tests__/ApiService.test.ts` (rojo). Skills: `tdd`.
- [ ] 3.4 Implementar el refresh single-flight + retry en el interceptor; verificar `npx vitest run src/__tests__/ApiService.test.ts` (verde). Skills: `tdd`.

## 4. Verificacion

- [ ] 4.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–3).
