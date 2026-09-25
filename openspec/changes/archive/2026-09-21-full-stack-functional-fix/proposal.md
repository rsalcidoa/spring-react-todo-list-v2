# Proposal: Full Stack Functional Fix

## Why

El proyecto TO-DO-Test tiene una arquitectura backend y frontend bien estructurada, pero presenta bloqueadores críticos que impiden su funcionamiento completo desde el navegador. Las peticiones del frontend no incluyen el token de autenticación (401 en todas las llamadas CRUD), el formulario de registro llama a `auth.login()` en vez de `registerUser()`, la ruta `/register` no existe en el router, y los DTOs del backend carecen de validación. Sin correcciones, la aplicación no puede ser utilizada ni siquiera para un flujo básico de registro-login-tareas.

## What Changes

- **Frontend Axios interceptor**: Agregar interceptor con `Authorization: Bearer <token>` a todas las peticiones de ApiService.ts. Las llamadas CRUD dejarán de devolver 401 Unauthorized.
- **RegisterPage corregido**: Llamar correctamente al servicio `registerUser()`; tras registro exitoso hacer auto-login con las mismas credenciales (el backend no devuelve token en el response) y redirigir a `/tasks`.
- **Ruta /register + navegación Login→Register**: Agregar `<Route path="/register">` en App.tsx, agregar enlace "¿No tienes cuenta? Registrarse" desde LoginPage.
- **Backend Bean Validation**: Añadir `@NotBlank`, `@Email` al email y `@Size(min=6)` a la password de RegisterRequest y LoginRequest; añadir `@NotBlank` al title de TaskRequest. Los endpoints `/v1/auth/register`, `/v1/auth/login` y `/v1/tasks` devolverán 400 con detalle de errores.
- **JWT secret a variable de entorno**: Configurar lectura desde `${todo.security.jwt.secret}` para no exponer el secreto hardcodeado en application.properties.
- **CORS production-ready**: Reemplazar wildcard `*` por origen específico `http://localhost:5173`.
- **Base de datos PostgreSQL persistente**: Migrar de H2 in-memory a PostgreSQL con driver JDBC; agregar docker-compose.yml con servicio PostgreSQL expuesto en localhost:5432. El API contract permanece idéntico (mismos endpoints, mismas respuestas).

## Non-goals

- No se implementan features nuevas (no hay búsqueda, filtros, paginación, categorías ni notificaciones).
- No se migra a un sistema de UI library (MUI instalado pero no usado se mantiene sin uso por ahora).
- No se agregan tests E2E (Playwright) ni CI/CD pipeline.
- No se implementa refresh token o session management más allá del JWT actual.
- No se agregan logs estructurados ni métricas.

## Capabilities

### Modified Capabilities

- **user-authentication**: Se añade el requisito de que tras registro exitoso el sistema haga auto-login automático y redirija al usuario a `/tasks`. Se añaden validaciones de formato (email válido, password mínima 6 caracteres) con respuesta 400 en caso de fallo.
- **frontend-integration**: Se añade el requisito de que todas las llamadas API incluyan automáticamente el header `Authorization: Bearer <token>` vía interceptor Axios. Se añade el requisito de que la ruta `/register` exista y redirija tras registro exitoso a `/tasks`.

### New Capabilities

- **backend-validation**: Nuevos requisitos para validación de inputs en todos los endpoints con respuestas 400 Bad Request incluyendo detalle de errores al fallar validación, y 201/200 normal cuando la validación pasa.

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.controller.AuthController`, `com.example.todo.dto.RegisterRequest.java`, `com.example.todo.dto.LoginRequest.java`, `com.example.todo.dto.TaskRequest.java`, `SecurityConfig.java` (CORS), `application.properties` |
| **Frontend TS** | `src/services/ApiService.ts` (interceptor Auth), `src/pages/RegisterPage.tsx` (lógica de registro + auto-login), `src/App.tsx` (rutas register/login) |
| **Config / Infra** | `backend/pom.xml` (H2 → PostgreSQL driver), `application.properties` (PostgreSQL config), `.env.example` (crear), `docker-compose.yml` (crear), eliminación de duplicado vite.config.ts ó .js |
| **Dependencias** | H2 JDBC → PostgreSQL JDBC en backend pom.xml; opcionalmente limpiar @mui/material del frontend package.json |

## Rollback Plan

- Cambiar application.properties y pom.xml a valores originales restaura la funcionalidad de base de datos tal como estaba (H2 in-memory).
- Revertir cambios de ApiService.ts, RegisterPage.tsx y App.tsx restaura el estado anterior del frontend.
- La migración H2→PostgreSQL es reversible: detener docker-compose, eliminar container, volver al driver H2 en pom.xml + application.properties. Los datos no persisten entre restarts incluso con H2, así que esta decisión no afecta pérdida de datos.
