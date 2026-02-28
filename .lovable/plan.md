
# Auditoria Completa del Sistema -- Campos, Modulos y Perfiles

## Resumen de Hallazgos

Se auditaron todos los perfiles de peleador, formularios de edicion, dashboards, y la base de datos. Se encontraron **7 problemas** que requieren correccion.

---

## Problemas Encontrados

### 1. CRITICO: Campo `phone` no existe en `fighter_profiles` -- Error silencioso en edicion

**Problema:** El formulario `UserFighterProfileEditForm.tsx` (linea 124) inicializa `phone` desde `profile.phone`, pero la tabla `fighter_profiles` **no tiene columna `phone`**. El campo `phone` vive en `app_user`. 

- El formulario carga `phone` del perfil del peleador (siempre sera `undefined`)
- Al guardar, intenta actualizar `app_user.phone` (lineas 286-293) pero la comparacion `data.phone !== profile.phone` siempre sera falsa si el perfil no carga el phone desde app_user
- El `ProfileProgressWidget` tambien evalua `(profile as any).phone` que siempre sera `undefined`

**Solucion:** Al cargar el perfil en LicenseDashboard, hacer un join o fetch separado de `app_user.phone` y pasarlo al formulario. Alternativamente, cargar el phone desde `useLicenseAuth` que ya tiene acceso al user.

**Archivos:** `src/components/UserFighterProfileEditForm.tsx`, `src/hooks/useProfileCompletion.tsx`, `src/pages/license/LicenseDashboard.tsx`

### 2. MEDIO: `document_type` y `document_number` no editables por el usuario

**Problema:** El dashboard muestra "Tipo de Documento" y "Numero de Documento" (lineas 431-437 de LicenseDashboard), pero el formulario `UserFighterProfileEditForm` **no incluye estos campos**. Solo el admin puede editarlos via `FighterEditModal`.

El esquema Zod del formulario no tiene `document_type` ni `document_number`. El usuario no puede completar esta informacion.

**Solucion:** Agregar campos `document_type` (Select con DNI/Pasaporte/Cedula) y `document_number` (Input) al formulario del usuario, en la seccion "Imagen de Identidad" donde ya sube la foto del documento.

**Archivos:** `src/components/UserFighterProfileEditForm.tsx`

### 3. MEDIO: `Postura` vs `Guardia` -- Inconsistencia terminologica

**Problema:** El LicenseDashboard muestra "Postura" (linea 469) pero el formulario de edicion dice "Guardia" (linea 696). La regla de negocio dice que se debe usar "Guardia" en todo el sistema.

**Solucion:** Cambiar "Postura" a "Guardia" en LicenseDashboard.

**Archivos:** `src/pages/license/LicenseDashboard.tsx` (linea 469)

### 4. MENOR: `window.location.reload()` en lugar de invalidacion de cache

**Problema:** LicenseDashboard usa `window.location.reload()` (lineas 813 y 832) cuando se crea o elimina una actualizacion del peleador. Esto es una mala practica que pierde todo el estado de la pagina.

**Solucion:** Reemplazar con invalidacion de React Query: `queryClient.invalidateQueries({ queryKey: ['fighter-updates'] })`.

**Archivos:** `src/pages/license/LicenseDashboard.tsx` (lineas 811-813, 830-832)

### 5. MENOR: Console.log en produccion

**Problema:** LicenseDashboard tiene `console.log` activos (lineas 40-41) que exponen datos de licencia en la consola del navegador.

**Solucion:** Eliminar los `console.log` de debugging.

**Archivos:** `src/pages/license/LicenseDashboard.tsx` (lineas 40-41)

### 6. MENOR: `FighterProfileForm.tsx` tiene console.log de debug

**Problema:** El formulario de creacion de perfil tiene logs de debug activos (lineas 64-69) que muestran datos de gimnasios en consola.

**Solucion:** Eliminar los `console.log` de debugging.

**Archivos:** `src/components/FighterProfileForm.tsx` (lineas 64-69)

### 7. INFO: Datos de `document_type` y `document_number` vacios en DB

**Problema:** Todos los perfiles de peleador consultados tienen `document_type` y `document_number` como `null`. Esto se debe al problema #2 -- los usuarios no pueden llenar estos campos.

**Solucion:** Se resuelve automaticamente al implementar el fix #2.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/UserFighterProfileEditForm.tsx` | Agregar campos document_type + document_number al esquema Zod y al formulario. Corregir carga inicial de phone desde app_user |
| `src/pages/license/LicenseDashboard.tsx` | Corregir "Postura" a "Guardia". Eliminar console.logs. Reemplazar window.location.reload() con invalidacion de cache. Pasar phone al formulario de edicion |
| `src/hooks/useProfileCompletion.tsx` | Documentar que phone viene de app_user (no cambia logica, solo depende del fix en el componente padre) |
| `src/components/FighterProfileForm.tsx` | Eliminar console.logs de debug |

**Total: 4 archivos. 0 archivos nuevos. Sin migraciones de base de datos (todos los campos ya existen en la DB).**

---

## Detalle Tecnico por Fix

### Fix 1: Phone desde app_user
- En `LicenseDashboard`, al pasar `fighterProfile` al formulario de edicion, enriquecer el objeto con el phone del usuario desde `licenseData` o un fetch a `app_user`
- El `useLicenseAuth` ya tiene el perfil del usuario; agregar `phone` al query de license status RPC o hacer fetch separado

### Fix 2: document_type + document_number en formulario
- Agregar al esquema Zod: `document_type: z.string().optional()` y `document_number: z.string().max(30).optional()`
- Agregar Select (DNI/Pasaporte/Cedula) + Input en la seccion "Imagen de Identidad"
- Incluir en `immediateUpdateFields` para actualizacion directa

### Fix 3: Postura -> Guardia
- Cambio de string en una linea

### Fix 4: Invalidacion de cache
- Importar `useQueryClient` y reemplazar `window.location.reload()` con `queryClient.invalidateQueries`

### Fix 5-6: Console.logs
- Eliminar lineas de debug
