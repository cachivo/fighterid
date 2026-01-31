

# Plan: Deshabilitar Predicciones y Mejorar Info de Eventos en Vivo

## Cambio 1: Eliminar "Predicciones" del Header

### Archivos a modificar: `src/components/Header.tsx`

| Ubicacion | Cambio |
|-----------|--------|
| Linea 51 | Eliminar de `navigationItems`: `{ name: "Predicciones", href: "/predicciones", icon: BarChart3 }` |
| Lineas 89-91 | Eliminar boton de navegacion desktop: `<Button variant="ghost" size="sm" asChild><Link to="/predicciones">Predicciones</Link></Button>` |

## Cambio 2: Mostrar Nombre del Evento en Vivo en el Hero

### Archivo a modificar: `src/components/Hero.tsx`

Actualmente (lineas 97-102):
```tsx
{stats?.liveEvents && stats.liveEvents.length > 0 
  ? `${stats.liveEvents.length} EVENTO${stats.liveEvents.length > 1 ? 'S' : ''} EN VIVO`
  : stats?.nextEvent
    ? `${stats.nextEvent.name.toUpperCase()} - ${format(...)}`
    : 'PROXIMOS EVENTOS PRONTO'
}
```

Propuesta - mostrar nombre y venue del evento en vivo:
```tsx
{stats?.liveEvents && stats.liveEvents.length > 0 
  ? `EN VIVO: ${stats.liveEvents[0].name.toUpperCase()}${stats.liveEvents[0].venue ? ` - ${stats.liveEvents[0].venue.toUpperCase()}` : ''}`
  : stats?.nextEvent
    ? `${stats.nextEvent.name.toUpperCase()} - ${format(...)}`
    : 'PROXIMOS EVENTOS PRONTO'
}
```

## Resultado Visual

```text
ANTES (Evento en vivo):         DESPUES (Evento en vivo):
┌─────────────────────┐         ┌─────────────────────┐
│ ● 1 EVENTO EN VIVO  │    →    │ ● EN VIVO: UCC 83   │
│                     │         │   - BREAK           │
└─────────────────────┘         └─────────────────────┘
```

## Seccion Tecnica

- Los datos de `stats.liveEvents` ya contienen `name`, `venue` y `description` del evento (segun `useRealTimeStats`)
- Se mantiene la logica para multiples eventos (aunque mostrara el primero)
- Se elimina la importacion de `BarChart3` si no se usa en otro lugar

