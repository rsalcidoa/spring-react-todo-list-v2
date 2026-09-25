# Proposal

## Why

El sistema de autenticación carece de un mecanismo de recuperación de contraseña, y la interfaz de usuario presenta errores de UX: validación de email performativa en frontend, mensajes de error inconsistentes (alert nativo, console.error silencioso, banners mal estilizados) y ausencia de gestión visual de tags más allá de la asignación a tareas.

## What Changes

- **Nuevo**: Password reset flow sin servicio de email — token de 6 caracteres con verificación manual
- **Nuevo**: Componente ErrorBanner (toast flotante) estandarizado para mensajes de error en toda la aplicación
- **Nuevo**: Creación y eliminación de tags directamente desde el modal de tareas
- **Nuevo**: Validación de formato de email en formularios de Login y Register (regex client-side)
- **Modificado**: Default de status en AddTaskModal — PENDING fijo en creación, editable en edición
- **Modificado**: LoginPage usa styles.error para mensajes de error

## Capabilities

### New Capabilities
- `password-reset`: Flujo de recuperación de contraseña sin SMTP (token manual 6 chars)

### Modified Capabilities
- `frontend-integration`: ADD email validation, ErrorBanner component, tag management UI, status default PENDING, standardized error display
- `tagging`: ADD user can create and delete tags from the task creation/editing modal UI
- `user-authentication`: ADD password reset request, verify token, and change password flows (manual token entry)

## Impact

**Backend**:
- `com.example.todo.model.User` — campos `resetToken`, `resetExpires`
- `com.example.todo.dto` — `ResetRequestDto`, `ResetVerifyDto`, `PasswordChangeDto`
- `com.example.todo.service.UserService` — `requestReset()`, `verifyToken()`, `changePassword()`
- `com.example.todo.controller.AuthController` — 3 nuevos endpoints POST/PUT
- `com.example.todo.exception` — `InvalidResetTokenException`, `ResetTokenExpiredException`
- `db/migration/V3__add_password_reset.sql` — migration
- `com.example.todo.repository.UserRepository` — `findByResetToken()`

**Frontend**:
- `src/components/ErrorBanner.tsx` — nuevo componente
- `src/components/ErrorBanner.module.css` — estilos del toast
- `src/pages/LoginPage.tsx` — link a ForgotPassword, corregir styles.error
- `src/pages/RegisterPage.tsx` — validar email, reemplazar alert() por ErrorBanner
- `src/pages/ForgotPasswordPage.tsx` — nueva ruta /forgot-password
- `src/pages/ResetPasswordPage.tsx` — nueva ruta /reset/:token
- `src/components/AddTaskModal.tsx` — input crear tag, botón eliminar, status default
- `src/components/AddTaskModal.module.css` — estilos para crear tag
- `src/App.tsx` — nuevas rutas
- `src/services/ApiService.ts` — endpoints de password reset
- `src/context/AuthContext.tsx` — logout tras password change exitoso

**Tests**:
- Vitest: `ErrorBanner.test.tsx`, `AddTaskModal.test.tsx` (actualizar), `ForgotPasswordPage.test.tsx`, `ResetPasswordPage.test.tsx`
- JUnit: `UserServiceTest` (reset methods), `AuthControllerTest` (reset endpoints)
- Playwright: e2e flow de password reset

## Non-goals

- No implementar envío real de email (no hay SMTP)
- No implementar "Remember me" o session persistence más allá del JWT actual
- No implementar change password para usuario logueado (solo recovery desde forgot)
- No implementar rate limiting ni brute-force protection en los endpoints de reset

## Rollback Plan

- DB: la migration V3 se puede rollback eliminando columnas reset_token y reset_expires
- Backend: revertir commits de AuthController, UserService, models, DTOs
- Frontend: revertir commits de components, pages, routes
- No hay breaking changes en la API existente
