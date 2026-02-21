
# Limpieza de Codigo: Mobile-First

El acceso es 100% movil. Vamos a eliminar codigo desktop-only y restricciones innecesarias que bloquean a usuarios moviles.

## Cambios a realizar

### 1. Eliminar archivos desktop-only (3 archivos)
- **`src/hooks/useDeviceRestriction.tsx`** - Hook que detecta si es desktop. Ya no se necesita.
- **`src/components/DesktopOnlyRoute.tsx`** - Componente que bloquea acceso movil. Eliminar.
- **`src/components/judge/DesktopJudgePanel.tsx`** - Panel de juez con clicks de mouse (izq/der). Este panel es incompatible con touch. Las estaciones de scoring (`Station1Scoring`, `Station2Scoring`) ya manejan la version movil-tactil, asi que este componente es redundante.

### 2. Adaptar `JudgeScoringPanel` para movil
- **`src/pages/judge/JudgeScoringPanel.tsx`** - Actualmente renderiza `DesktopJudgePanel`. Se adaptara para redirigir al flujo de estaciones moviles (`/estacion/X/scoring/:fightId`) en lugar de mostrar el panel desktop.

### 3. Desbloquear `AdminLayout` en movil
- **`src/components/AdminLayout.tsx`** - Actualmente muestra "Acceso Restringido" en pantallas menores a 768px. Se eliminara ese bloqueo y se mostrara el sidebar como sheet/drawer en movil (el componente `Sidebar` de shadcn ya soporta esto nativamente con `useIsMobile`).

### 4. Limpiar rutas en `App.tsx`
- Quitar el wrapper `<DesktopOnlyRoute>` de la ruta `/judge/fight/:fightId`.
- Quitar el import de `DesktopOnlyRoute`.

### 5. Simplificar `use-mobile.tsx`
- Mantener `useIsMobile` (lo usa el sidebar de shadcn).
- Evaluar si `useBreakpoints` con `isDesktop` sigue siendo necesario. Si `AdminLayout` ya no lo necesita, simplificar.

---

## Detalle tecnico

### Archivos a eliminar
- `src/hooks/useDeviceRestriction.tsx`
- `src/components/DesktopOnlyRoute.tsx`
- `src/components/judge/DesktopJudgePanel.tsx`

### Archivos a editar
| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Quitar import y wrapper `DesktopOnlyRoute` |
| `src/components/AdminLayout.tsx` | Eliminar bloqueo movil, mostrar layout completo en todas las pantallas |
| `src/pages/judge/JudgeScoringPanel.tsx` | Redirigir al flujo de estaciones moviles en vez de renderizar `DesktopJudgePanel` |

### Lo que NO se toca
- **Clases CSS responsivas** (`md:grid-cols-2`, `lg:grid-cols-3`, etc.) - Estas son responsive design normal y benefician la experiencia en cualquier pantalla. No son "desktop-only".
- **`SocialSidebar`** (`hidden lg:block`) - Es un sidebar complementario que se oculta en movil. Es correcto. El contenido principal sigue accesible.
- **`Header`** - Ya tiene navegacion movil con hamburger menu. Funciona bien.
- **Hooks de red/performance** - `useNetworkStatus`, `useOptimizedQuery`, etc. son utiles para movil.

### Resultado
~200 lineas de codigo eliminadas, 0 restricciones de acceso bloqueando usuarios moviles, panel admin accesible desde cualquier dispositivo.
