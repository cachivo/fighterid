

# Optimizacion del Panel Admin para Tablets

## Problema

En tablets (768px-1024px), el sidebar ocupa 256px (16rem) de una pantalla de ~768-834px, dejando solo ~500px para el contenido principal. Esto causa que las tarjetas, tablas y formularios se compriman excesivamente. El sidebar no se colapsa automaticamente en tablets, y las grillas saltan de 1 columna (movil) a 2-4 columnas (md/lg) sin un paso intermedio optimizado.

## Cambios

### 1. Sidebar colapsado por defecto en tablets

**Archivo: `src/components/AdminLayout.tsx`**

Usar `useBreakpoints()` para detectar si el dispositivo es tablet (768-1024px). Si lo es, iniciar el sidebar en estado colapsado (icon mode) para maximizar el espacio de contenido. El usuario puede expandirlo manualmente con el SidebarTrigger.

- Pasar `defaultOpen={false}` al `SidebarProvider` cuando es tablet
- El sidebar en modo colapsado ocupa solo 3rem (48px) en vez de 16rem (256px)
- En desktop (1024px+) sigue abierto por defecto como ahora

### 2. Padding y espaciado reducido en tablets

**Archivo: `src/components/AdminLayout.tsx`**

Ajustar el padding del contenido principal:
- Actual: `p-4 lg:p-5`
- Nuevo: `p-3 md:p-4 lg:p-5`

### 3. Grillas adaptadas para tablets en paginas clave

**Archivo: `src/pages/admin/Dashboard.tsx`**

- Stats cards: cambiar `md:grid-cols-2 lg:grid-cols-4` a `grid-cols-2 lg:grid-cols-4` (2 columnas desde movil grande)
- Cards de contenido: mantener `md:grid-cols-2` (ya funciona bien)

**Archivo: `src/pages/admin/GimnasiosAdmin.tsx`**

- Grilla de gimnasios: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ya es correcta, no requiere cambios

**Archivo: `src/pages/admin/FightersProfiles.tsx`**

- Revisar que los filtros (search + selects) se apilen correctamente en tablet con `flex-wrap`

### 4. Touch targets mejorados en sidebar

**Archivo: `src/components/AdminSidebar.tsx`**

Agregar `min-h-[44px]` a los items del menu para cumplir con el estandar tactil de 44px minimo, facilitando el uso en tablets con pantalla tactil.

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/AdminLayout.tsx` | Sidebar colapsado por defecto en tablets + padding ajustado |
| `src/components/AdminSidebar.tsx` | Touch targets de 44px en items del menu |
| `src/pages/admin/Dashboard.tsx` | Grilla de stats optimizada para tablets |

## Lo que NO se modifica

- El sidebar component base (`sidebar.tsx`) ya soporta colapso/expansion correctamente
- Las paginas con tablas (`RankingsManagement`, `EventosPelea`) ya usan `overflow-x-auto`
- Los modales ya tienen `max-w-[95vw]` para tablets (implementado previamente)
