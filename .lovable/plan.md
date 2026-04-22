

# Auditoría de código — Limpieza, formularios y emails

## Hallazgos

### 1. Código muerto / archivos sin uso

| Archivo / Ruta | Estado | Acción |
|---|---|---|
| `src/components/admin/QuickUpdateRandyImage.tsx` | 0 referencias en todo el código | Eliminar |
| `src/pages/TestNewsFunction.tsx` + ruta `/test-news` en `App.tsx` | Página de debug expuesta en producción (sin protección) | Eliminar página y ruta |
| `supabase/functions/bet-delay-processor/` | No hay cron job configurado, ni invocaciones | Mantener pero documentar — es para sistema de apuestas futuro |
| `supabase/functions/process-email-queue/` | No hay cron job ni invocaciones | Mantener — infraestructura preparada |

### 2. Formularios con campos mal inicializados (viola `numeric-field-sanitization`)

`src/components/FighterProfileForm.tsx` usa `undefined` para campos numéricos opcionales:
- Líneas 43-45: estado inicial con `height_cm: undefined, weight_kg: undefined, reach_cm: undefined`
- Líneas 369, 385, 396: handlers que envían `undefined` cuando el input está vacío

**Estándar requerido**: usar `null` explícito para campos físicos opcionales vacíos. `undefined` rompe `react-hook-form`-style controlled components y la columna en Postgres.

### 3. Formularios sin react-hook-form / zod (deuda técnica)

| Formulario | Estado actual | Recomendación |
|---|---|---|
| `ContactForm.tsx` | `useState` plano, sin validación zod | Migrar a `react-hook-form` + zod (regla de seguridad de input validation) |
| `FighterProfileForm.tsx` | `useState` plano, validación manual | Migrar a `react-hook-form` + zod |
| `AdminFighterForm.tsx` | `useState` plano | Migrar a `react-hook-form` + zod |

Los formularios modernos (`UserProfileForm`, `UserFighterProfileEditForm`) ya usan el patrón correcto. Esta migración alinea el código con el estándar.

### 4. Console.logs en producción

46 `console.log` en `src/components/` y `src/pages/` (excluyendo errores). Limpiar los de debug, conservar los que ayudan a diagnosticar.

### 5. Sistema de emails — Todo OK

Las 8 funciones edge de email (`send-fighter-invitation`, `send-gym-invitation`, `send-license-approval`, `send-mass-email`, `send-password-recovery`, `send-signup-confirmation`, `notify-admin-pending`, `process-email-queue`) usan correctamente `sendEmailWithFallback` y `EmailTemplates.wrap` del módulo compartido. Cumplen `EMAIL_BEST_PRACTICES.md`.

## Plan de cambios

### Fase 1 — Eliminar código muerto
- Borrar `src/components/admin/QuickUpdateRandyImage.tsx`
- Borrar `src/pages/TestNewsFunction.tsx`
- Quitar import (línea 53) y ruta `/test-news` (línea 190) de `src/App.tsx`

### Fase 2 — Saneamiento numérico (`FighterProfileForm.tsx`)
- Cambiar inicialización de `height_cm`, `weight_kg`, `reach_cm` de `undefined` a `null`
- Actualizar handlers `onChange` para enviar `null` cuando el input está vacío en vez de `undefined`
- Verificar que el `onSubmit` no envía claves con valor `undefined` a Supabase

### Fase 3 — Migrar `ContactForm.tsx` a react-hook-form + zod
- Crear schema zod con: `name (1-100)`, `email (RFC + max 255)`, `subject (1-200)`, `message (1-1000)`
- Reemplazar `useState({...})` por `useForm({ resolver: zodResolver(schema) })`
- Mostrar errores inline con `<FormMessage />`

### Fase 4 — Limpieza de console.logs
- Eliminar `console.log` de debug en componentes y páginas (solo conservar los que loguean errores capturados)

### Fase 5 — Verificación final
- Confirmar que rutas eliminadas no se referencian en otros lados
- Confirmar que los formularios siguen funcionando con los cambios

## Lo que NO se toca

- Las funciones edge de email (ya cumplen estándar)
- Los formularios `UserProfileForm` y `UserFighterProfileEditForm` (ya usan el patrón correcto)
- `AdminFighterForm` (más complejo — se deja para una fase posterior si lo apruebas)
- `bet-delay-processor` y `process-email-queue` (infraestructura preparada, no es código muerto real)

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/admin/QuickUpdateRandyImage.tsx` | Eliminar |
| `src/pages/TestNewsFunction.tsx` | Eliminar |
| `src/App.tsx` | Quitar import y ruta `/test-news` |
| `src/components/FighterProfileForm.tsx` | `undefined` → `null` en campos numéricos |
| `src/components/ContactForm.tsx` | Migrar a react-hook-form + zod |
| `src/components/` y `src/pages/` (varios) | Limpieza de `console.log` de debug |

