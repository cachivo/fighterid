

## Plan: Página Admin de Transmisiones En Vivo

### Problema actual
El enlace "Transmisiones En Vivo" en el sidebar admin lleva a `/en-vivo` (la página pública). No hay una página admin dedicada para gestionar las transmisiones. La configuración de streaming está escondida dentro de cada evento en EventosPelea.

### Solución

**1. Crear `src/pages/admin/LiveStreaming.tsx`** — Nueva página admin dedicada
- Lista todos los eventos con su estado de streaming (activo/inactivo)
- Permite configurar embed URL, chat URL, y toggle en vivo directamente desde la tabla
- Botón para abrir la transmisión pública (`/en-vivo`)
- Auto-convierte URLs normales de YouTube (`youtube.com/watch?v=` o `youtu.be/`) al formato embed (`youtube.com/embed/VIDEO_ID`)
- Muestra preview del embed inline
- Filtra eventos por estado (todos, próximos, en vivo)

**2. Actualizar `src/components/AdminSidebar.tsx`**
- Cambiar el enlace "Transmisiones En Vivo" de `/en-vivo` a `/admin/live-streaming`

**3. Actualizar `src/App.tsx`**
- Agregar ruta `/admin/live-streaming` → `LiveStreaming`

### Flujo admin
```
Sidebar → Transmisiones En Vivo → /admin/live-streaming
  → Ve lista de eventos con estado de stream
  → Pega URL de YouTube (normal o embed) → se auto-convierte
  → Activa toggle "En Vivo" → se guarda
  → Link para ver la página pública /en-vivo
```

### Archivos

| Archivo | Acción |
|---------|--------|
| `src/pages/admin/LiveStreaming.tsx` | Crear — página admin de gestión de streams |
| `src/components/AdminSidebar.tsx` | Modificar — cambiar URL del enlace |
| `src/App.tsx` | Modificar — agregar ruta |

