# Tasks — Unify password-change operation and error shape

## 1. Operación única + validez centralizada

- [x] 1.1 Mover la igualdad a `UserService.changePasswordViaReset(token, newPassword, confirmPassword)` con helper `requireValidToken` y `Clock` inyectado, adelgazar `AuthController.resetChange`, y verificar `mvn -Dtest=UserServiceTest,AuthControllerTest test` en verde
- [x] 1.2 Inyectar el encoder como bean y verificar `mvn test` compila y pasa el módulo User

## 2. Contrato de error único + regresión

- [x] 2.1 Unificar bodies en `GlobalExceptionHandler` (constructor compartido; `403/404/409-tag` con `{error}` estable) y añadir unit tests de los handlers antes solo cubiertos vía MockMvc, y verificar `mvn -Dtest=GlobalExceptionHandlerTest test` en verde
- [x] 2.2 Correr suite completa `docker compose up -d && cd backend && mvn test` en verde, actualizar frontend solo si algún test frontend asertaba body vacío (no se espera), y archivar con `openspec archive`
