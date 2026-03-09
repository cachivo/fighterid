

## Plan: Eventos En Vivo (Live Streaming)

### Concepto

Agregar una página pública `/en-vivo` donde los usuarios ven las transmisiones en vivo de eventos (YouTube embeds) agrupados por liga/organización (UCC, Honduras Hoodfights, etc.). También agregar gestión en admin para configurar el embed URL de cada evento, y un botón "Ver En Vivo" en el detalle del evento cuando esté live.

### Arquitectura

No se necesitan nuevas tablas. El campo `meta` (JSON) de `bdg_event` ya existe y se usa para branding. Se extenderá para incluir:

```json
{
  "branding": { ... },
  "live_stream": {
    "embed_url": "https://www.youtube.com/embed/VIDEO_ID",
    "chat_embed_url": "https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=fighterid.lovable.app",
    "is_streaming": true
  }
}
```

### Cambios

**1. Nueva página: `src/pages/EnVivo.tsx`** — Página pública `/en-vivo`
- Consulta `bdg_event` donde `state = 'live'` y `meta->live_stream->is_streaming = true`
- Muestra cada evento con su iframe de YouTube embed
- Agrupa por organización (logo de la org al lado)
- Si no hay eventos en vivo, muestra un estado vacío con próximos eventos
- Diseño oscuro estilo arena, consistente con EventDetail

**2. Actualizar: `src/pages/admin/EventosPelea.tsx`** — Sección admin para configurar stream
- Agregar campos en el formulario de edición de evento:
  - "URL de Transmisión (YouTube embed)" — input de texto
  - "URL del Chat en Vivo" — input opcional
  - "Transmitiendo en vivo" — toggle switch
- Estos valores se guardan en `meta.live_stream`

**3. Actualizar: `src/pages/EventDetail.tsx`** — Botón "Ver En Vivo"
- Si el evento tiene `state === 'live'` y `meta.live_stream.is_streaming`, mostrar un botón prominente rojo "📺 Ver En Vivo" que lleva a `/en-vivo` o que muestre el embed inline

**4. Actualizar: `src/pages/Events.tsx`** — Banner de eventos en vivo
- Agregar un banner superior cuando hay eventos live con streaming, con link a `/en-vivo`

**5. Actualizar: `src/App.tsx`** — Agregar ruta `/en-vivo`

**6. Actualizar: `src/components/Header.tsx`** — Agregar enlace "En Vivo" en la navegación con indicador pulsante rojo cuando hay eventos live

**7. Actualizar: `src/components/AdminSidebar.tsx`** — Agregar enlace "Transmisiones En Vivo" en la sección de control de peleas

### Flujo de usuario

```text
Admin:
  EventosPelea → Editar evento → Pegar URL de YouTube embed → Activar toggle "En Vivo"
  
Usuario:
  Header (🔴 En Vivo) → /en-vivo → Ve iframe de YouTube con el evento
  EventDetail → Botón "Ver En Vivo" → /en-vivo o embed inline
```

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/EnVivo.tsx` | Crear — página pública de streaming |
| `src/pages/admin/EventosPelea.tsx` | Modificar — agregar campos de stream en edición |
| `src/pages/EventDetail.tsx` | Modificar — botón Ver En Vivo |
| `src/pages/Events.tsx` | Modificar — banner de live |
| `src/App.tsx` | Modificar — ruta `/en-vivo` |
| `src/components/Header.tsx` | Modificar — link En Vivo |
| `src/components/AdminSidebar.tsx` | Modificar — link admin |

