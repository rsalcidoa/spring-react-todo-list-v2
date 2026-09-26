# Proposal — Interfaz 100% en español

## Why

La UI mezcla EN (mayoría, ~50 cadenas) y ES (`Entrar`, `Eliminar esta tarea?`, `Este email…`). Además el frontend muestra mensajes crudos del backend en inglés (`Validation failed`, `Reset token has expired`) donde ya posee mapeo por código. Un solo idioma elimina una clase entera de incoherencias visibles.

## What Changes

- Español hardcodeado en todo el frontend según el glosario fijo (abajo) — un solo idioma requerido, sin librería i18n.
- El frontend deja de mostrar inglés del backend: todo pasa por `toDisplayMessage`/fallbacks en español; `ResetPasswordPage` ya compara por código (cambio previo) y mantiene su rama con texto ES.
- Tests (unit + e2e `full-flow.spec.ts`) actualizados a los nuevos textos — el gate los fija como contrato de copy.
- Backend intacto (contrato y specs de validación en inglés se mantienen; la traducción vive en el borde).

## Glosario (fuente única, normativo)

- Board: `Task Board`→`Tablero`, `To Do`→`Por hacer`, `In Progress`→`En progreso`, `Done`→`Hecho`, `+ Task`→`+ Tarea`, `Logout`→`Cerrar sesión`.
- Modal: `Add/Edit Task`→`Nueva/Editar tarea`, `Save`→`Guardar`, `Cancel`→`Cancelar`, `Title/Description/Priority/Status/Due Date/Tags`→`Título/Descripción/Prioridad/Estado/Vencimiento/Etiquetas`, `Create`→`Crear`, `New tag name`→`Nueva etiqueta`; selects `Baja/Media/Alta`, `Pendiente/En progreso/Completada` (valores wire intactos); el badge de prioridad de la tarjeta usa las mismas etiquetas.
- Auth/reset: `Login`→`Iniciar sesión`, `Register`→`Registrarse`, `Forgot password?`→`¿Olvidaste tu contraseña?`, `Send reset code`→`Enviar código`, `Continue to reset`→`Continuar`, `Back to login`→`Volver`, `New/Confirm password`→`Nueva/Confirmar contraseña`, `Already have an account? Login`→`¿Ya tienes cuenta? Inicia sesión`.
- Errores: `This tag already exists`→`Esta etiqueta ya existe`, `Tag name is invalid`→`Nombre de etiqueta inválido`, `This tag no longer exists`→`La etiqueta ya no existe`, `Invalid email format`→`Formato de email inválido`, `Invalid email or password`→`Email o contraseña inválidos`, `Passwords do not match`→`Las contraseñas no coinciden`, `Failed to reset password`→`No se pudo restablecer`, `Failed to request password reset`→`No se pudo solicitar el restablecimiento`, `If the email is registered…`→`Si el email está registrado…`, `Missing reset token`→`Falta el código`, `Something went wrong`→`Algo salió mal`, `Error en registro` (ya ES, se conserva).
- Due/filtros del cambio 2: `Vencida/Vence hoy/Sin fecha`, `Tags:`→`Etiquetas:`, empty states y skeletons en español, botón copiar `Copiar/Copiado`.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `frontend-integration`: todos los requirements con copy visible (Task List View, Create/Edit/Delete, Tag Creation/Deletion, Registration/Login/Reset Pages, ErrorBanner, Email Validation) — escenarios actualizados a textos ES.

## Impact

- Módulos: todos los `.tsx` con copy + `TAG_ERROR_FALLBACKS`/mapeos + tests Vitest + `e2e/full-flow.spec.ts`.
- Sin cambios backend, rutas, lógica ni API. Depende del cambio 2 (los nuevos textos del 2 nacen ya en español).
- Cambio amplio en líneas pero mecánico (búsqueda por glosario); no se subdivide porque el idioma debe aterrizar de una vez (mitades bilingües = peor estado).

## Non-goals

- i18n multi-idioma o librería de internacionalización.
- Cambiar mensajes del contrato backend (siguen en inglés; el borde traduce).
- Temas (cambio 4).

## Rollback plan

Revert del commit. Solo frontend; rollback seguro.
