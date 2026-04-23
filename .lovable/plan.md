

# Fix urgente: enlaces rotos del sidebar admin + falso "Sin acceso" para super_admin

## Diagnóstico

Hay **dos bugs** que combinados producen el problema reportado:

### Bug 1 — Race condition en `useUserDisciplineAccess` (causa del toast)

`useUserDisciplineAccess` solo expone `isLoading: query.isLoading` (la query de `user_discipline_access`), pero **no espera a que `useUserRole` termine de cargar los roles**.

Resultado en el primer render de `/admin/mma/*` o `/admin/boxeo/*`:
1. `useUserRole.loading = true` → `isAdmin = false, isSuperAdmin = false`
2. `hasFullAccess = false`
3. `user_discipline_access` devuelve `[]` (el usuario es super_admin, nunca le insertaron filas en esa tabla)
4. `query.isLoading` pasa a `false` rápido
5. `AdminDisciplineLayout` ve `isLoading=false && hasAccess=false` → dispara toast "No tienes acceso al panel de MMA" y redirige a `/admin`
6. Milisegundos después `useUserRole` termina y reconoce que es super_admin, pero ya redirigió

Esto le pasa al usuario `cachivo@gmail.com`, que en BD tiene los roles `admin, super_admin, moderator, user` correctamente asignados.

### Bug 2 — Rutas inexistentes en el AdminLayout general

El `AdminSidebar` (que se renderiza en `/admin/*` general) tiene enlaces a URLs como:

- `/admin/licencias` → `ValidacionLicencias`
- `/admin/entrenadores`, `/admin/sanctions`, `/admin/organizations`
- `/admin/aliados-estrategicos`, `/admin/pending-changes`, `/admin/fight-approval`
- `/admin/betting`, `/admin/email-monitoring`, `/admin/email-campaigns`, `/admin/email-campaigns/editor`
- `/admin/comunidad`, `/admin/officials`, `/admin/judges`, `/admin/scoring/stations`
- `/admin/live-events`, `/admin/live-streaming`, `/admin/fight-results`
- `/admin/ai-strike-monitor`, `/admin/ai-strike-test`, `/admin/vision-diagnostics`

Pero en `App.tsx`, el bloque `/admin/*` solo define rutas para: `cola-aprobacion`, `configuracion`, `user-roles`, `system-assets`, `inbox` y 5 redirects legacy a `/admin/mma/*` (`eventos-pelea`, `fighters-profiles`, `fighters`, `rankings`, `gimnasios`).

Resultado al hacer clic en "Licencias Fighter ID": URL `/admin/licencias` no matchea ninguna ruta interna → cae al `<Routes>` interno sin match → AdminLayout queda vacío. El usuario percibe "no carga" o, si previamente intentó `/admin/mma/licencias`, ve el toast de la disciplina.

## Solución

### Cambio 1 — Arreglar el race condition

`src/hooks/useUserDisciplineAccess.ts`:
- Importar `loading` de `useUserRole` y combinarlo en el `isLoading` retornado.
- Cuando `useUserRole.loading=true`, no concluir `hasAccess=false`. El layout debe seguir mostrando el spinner.

```ts
const { isAdmin, isSuperAdmin, loading: rolesLoading } = useUserRole();
// ...
isLoading: query.isLoading || rolesLoading,
```

Esto garantiza que `AdminDisciplineLayout` espere a que se resuelvan los roles antes de decidir.

### Cambio 2 — Arquitectura de navegación: redirigir TODO a las disciplinas

El admin general (`/admin`) es solo un **selector de disciplina** + funciones cross-discipline (cola de aprobación, system-assets, user-roles, inbox). El resto de la operación vive bajo `/admin/mma/*` y `/admin/boxeo/*`.

Por lo tanto, el sidebar `AdminSidebar` no tiene sentido en el contexto general — debería estar simplificado. Pero hoy se usa en el AdminLayout general. Dos opciones:

**Opción A (recomendada y rápida para el demo)**: Reescribir `AdminSidebar` para que solo muestre los items que SÍ existen en el bloque general:
- Dashboard (`/admin`)
- Cola de Aprobación (`/admin/cola-aprobacion`)
- Inbox de Contacto (`/admin/inbox`)
- Sección Cuenta Maestra: System Assets, User Roles, Configuración (solo super_admin)
- Quitar todos los demás items de `adminItems` y `fightControlItems`. La gestión operativa se hace seleccionando disciplina desde el Dashboard (DisciplineSidebar ya tiene todos esos enlaces).

**Opción B**: Agregar todas las rutas faltantes como redirects al panel MMA por defecto (siguiendo el patrón ya existente de líneas 343-347).

Voy con la **Opción A** porque:
- Mantiene la separación clara: admin general = selector + ajustes; disciplina = operación.
- Evita confusión durante el demo (clicks en el sidebar general no llevarían a un panel MMA inesperado).
- Es coherente con `AdminDisciplineSidebar` que sí tiene todos esos enlaces bajo su disciplina.

Adicionalmente, agregar al **Dashboard de admin** dos botones grandes "Entrar a Panel MMA" / "Entrar a Panel Boxeo" si no existen ya, para que la navegación a la disciplina sea obvia.

### Cambio 3 — Verificación rápida

Después del fix:
1. Login como `cachivo@gmail.com` → ir a `/admin` → ver dashboard.
2. Clic en "Panel MMA" → cargar `/admin/mma` sin toast de error.
3. Clic en "Licencias Fighter ID" dentro del sidebar de disciplina → cargar `ValidacionLicencias`.
4. Volver a `/admin` → el sidebar general muestra solo Dashboard / Cola Aprobación / Inbox / (super-admin items).

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/hooks/useUserDisciplineAccess.ts` | Combinar `useUserRole.loading` en `isLoading` para evitar falso negativo de `hasAccess` |
| `src/components/AdminSidebar.tsx` | Reducir `adminItems` y `fightControlItems` a solo las rutas que realmente existen en el bloque `/admin/*` general (Dashboard, Cola de Aprobación, Inbox). Mantener sección super-admin |
| `src/pages/admin/Dashboard.tsx` | Verificar/agregar dos CTA grandes a "Panel MMA" y "Panel Boxeo" |

## Lo que NO cambia

- `AdminDisciplineSidebar` (sidebar de MMA/Boxeo) ya tiene todos los enlaces correctos dentro de su disciplina.
- RLS, `useUserRole`, `useAdmin`, `AdminProtectedRoute`: todos funcionan bien.
- Las rutas de `/admin/mma/*` y `/admin/boxeo/*`: intactas.

