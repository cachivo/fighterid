

# Plan: Rediseño del Módulo de Gimnasios Admin + Auditoría de Coherencia

## Problemas Identificados

1. **Sin buscador en admin**: `GimnasiosAdmin.tsx` no tiene campo de búsqueda (la página pública `Gimnasios.tsx` sí lo tiene)
2. **Nombre truncado**: `AdminGymCard.tsx` línea 93 usa `truncate` en `gym.nombre` — viola la política de no-truncamiento (visible en el screenshot: "CLUB DE B...")
3. **Layout desordenado en mobile**: El header con título + botón "Crear Gimnasio" no tiene estructura responsive adecuada
4. **Botón "Crear Gimnasio" invisible para no-SuperAdmin**: El botón solo aparece si `isSuperAdmin`, pero la condición ya es correcta — el problema es que el layout se rompe cuando aparece
5. **GymCard pública también trunca**: `GymCard.tsx` línea 36 y 42 usan `truncate` en nombre y ciudad
6. **Datos coherentes**: Los gimnasios se sirven desde `useGyms()` (tabla `gyms` con `activo=true`) y `useGymsList()` (misma tabla, campos reducidos). Ambos hooks consultan la misma fuente — están sincronizados correctamente.

## Cambios Propuestos

### 1. `src/pages/admin/GimnasiosAdmin.tsx` — Agregar buscador + mejorar layout
- Agregar campo de búsqueda por nombre/ciudad (mismo patrón que `Gimnasios.tsx`)
- Reorganizar header: título a la izquierda, contador + botón a la derecha, responsive con `flex-wrap`
- Agregar contador de gimnasios registrados
- Mejorar estado de carga con skeletons en lugar de texto "Cargando..."

### 2. `src/components/admin/AdminGymCard.tsx` — Quitar truncate del nombre
- Línea 93: Reemplazar `truncate` por `break-words leading-tight` en `gym.nombre`

### 3. `src/components/gym/GymCard.tsx` — Quitar truncate del nombre y ciudad
- Línea 36: Reemplazar `truncate` por `break-words leading-tight` en `gym.nombre`
- Línea 42: Reemplazar `truncate` por `break-words leading-tight` en ciudad

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/GimnasiosAdmin.tsx` | Agregar buscador, mejorar layout responsive, skeletons |
| `src/components/admin/AdminGymCard.tsx` | Quitar truncate del nombre |
| `src/components/gym/GymCard.tsx` | Quitar truncate de nombre y ciudad |

## Verificación de Coherencia de Datos

Los gimnasios en el sistema se consumen desde dos hooks:
- `useGyms()` → lista completa para admin y página pública
- `useGymsList()` → lista reducida (id, nombre, logo, slug) para selectores en formularios de peleadores, onboarding, etc.

Ambos filtran por `activo=true` y ordenan por `nombre`. Están sincronizados. Los selectores de gimnasio en `AdminFighterForm`, `FighterEditModal`, `LicenseOnboarding`, `UserFighterProfileEditForm` y `FightersProfiles` todos usan estas mismas fuentes. La coherencia está garantizada — un gimnasio creado aparecerá automáticamente en todos los módulos.

**3 archivos. Sin migraciones SQL.**

