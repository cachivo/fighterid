

# Plan: Consolidación del Sistema de Moderación Admin

## Análisis de Redundancia Detectada

### Componente 1: Centro de Moderación (`/admin/pending-changes`)
| Aspecto | Detalle |
|---------|---------|
| Hook | `usePendingChanges` |
| Datos | 3 tipos: Profile Changes, Fighter Updates, Doping Tests |
| Filtro | Solo muestra items PENDING |
| UI | Cards con diálogos |
| Funciones | Aprobar/Rechazar de 3 tipos de contenido |

### Componente 2: Solicitudes de Cambio (`/admin/profile-requests`)
| Aspecto | Detalle |
|---------|---------|
| Hook | `useProfileChangeRequests` |
| Datos | Solo Profile Change Requests |
| Filtro | Muestra TODOS los estados (PENDING, APPROVED, REJECTED) |
| UI | Tabla con estadísticas |
| Funciones | Aprobar/Rechazar + opción "Solicitar Info" |

---

## Problema Identificado

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    SOLAPAMIENTO ACTUAL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Centro de Moderación          Solicitudes de Cambio                 │
│  ┌─────────────────────┐       ┌─────────────────────┐              │
│  │ ☑ Profile Changes   │       │ ☑ Profile Changes   │ ← DUPLICADO  │
│  │   (solo PENDING)    │       │   (TODOS estados)   │              │
│  ├─────────────────────┤       └─────────────────────┘              │
│  │ ☑ Fighter Updates   │                                            │
│  │   (solo PENDING)    │                                            │
│  ├─────────────────────┤                                            │
│  │ ☑ Doping Tests      │                                            │
│  │   (solo PENDING)    │                                            │
│  └─────────────────────┘                                            │
│                                                                      │
│  RESULTADO: 2 lugares para gestionar Profile Changes                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Solución Propuesta: Consolidación Inteligente

Fusionar ambas páginas en un **Centro de Moderación mejorado** que incluya:

1. **Filtrado por estado** (no solo pending)
2. **Estadísticas visuales** (del ProfileChangeRequests)
3. **Historial completo** de cada tipo de solicitud
4. **Eliminar página redundante**

---

## Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────────┐
│            NUEVO CENTRO DE MODERACIÓN UNIFICADO                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Stats Cards]                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Pending  │ │ Approved │ │ Rejected │ │  Total   │               │
│  │    12    │ │    45    │ │     3    │ │    60    │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  [Filtros]                                                           │
│  Estado: [Todos ▼] [Pendientes] [Aprobados] [Rechazados]            │
│                                                                      │
│  [Tabs]                                                              │
│  ┌───────────────┬────────────────┬──────────────┐                  │
│  │   Perfiles    │   Updates      │    Dopaje    │                  │
│  │     (8)       │     (3)        │      (1)     │                  │
│  └───────────────┴────────────────┴──────────────┘                  │
│                                                                      │
│  [Lista de items según tab y filtro activo]                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Avatar | Nombre | Tipo de Cambio | Estado | Fecha | Acciones  │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │   👤   │ Clara Pinto │ Récord │ Pending │ 31/01 │ [Revisar]   │ │
│  │   👤   │ José Mejia  │ Bio    │ Pending │ 31/01 │ [Revisar]   │ │
│  │   👤   │ Willis Yang │ Récord │ Approved│ 30/01 │ [Ver]       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cambios a Implementar

### 1. Actualizar `usePendingChanges.tsx`
- Agregar parámetro opcional `status` para filtrar (no solo PENDING)
- Agregar función `fetchAllByType()` que retorna todos los estados
- Mantener `fetchPendingOnly()` para el contador del sidebar

### 2. Actualizar `PendingChangesHub.tsx`
- Agregar filtro de estado (Select: Todos/Pendientes/Aprobados/Rechazados)
- Agregar cards de estadísticas al inicio
- Agregar opción "Solicitar Info" del ProfileChangeRequests
- Mejorar tabla/lista con información del revisor y fecha de revisión

### 3. Eliminar `ProfileChangeRequests.tsx`
- Mover funcionalidad "Solicitar Info" al Centro de Moderación
- Eliminar archivo
- Eliminar ruta de App.tsx

### 4. Actualizar `AdminSidebar.tsx`
- Eliminar item "Solicitudes de Cambio"

---

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/usePendingChanges.tsx` | Agregar filtrado por status |
| `src/pages/admin/PendingChangesHub.tsx` | Agregar filtros, stats, mejorar UI |
| `src/pages/admin/ProfileChangeRequests.tsx` | **ELIMINAR** |
| `src/components/AdminSidebar.tsx` | Remover item redundante |
| `src/App.tsx` | Remover ruta `/admin/profile-requests` |
| `src/hooks/useProfileChangeRequests.ts` | Mantener (usado por peleadores para crear solicitudes) |

---

## Funcionalidades Mejoradas

### Nuevas características del Centro de Moderación:

1. **Filtrado por estado**
   - Todos
   - Pendientes (default)
   - Aprobados
   - Rechazados
   - Requiere Info

2. **Estadísticas visuales**
   - Total de solicitudes
   - Pendientes (badge rojo para urgencia)
   - Aprobadas hoy/semana
   - Rechazadas

3. **Información de auditoría**
   - Quién revisó
   - Cuándo se revisó
   - Notas del admin

4. **Acción adicional**
   - "Solicitar Más Información" (del ProfileChangeRequests original)

---

## Beneficios

- **UX Simplificado**: Un solo lugar para toda la moderación
- **Menos confusión**: No hay duplicación de funcionalidad
- **Mejor auditoría**: Historial visible en el mismo lugar
- **Código más limpio**: Menos archivos que mantener
- **Sidebar más ordenado**: Menos opciones redundantes

---

## Impacto

- **Archivos a eliminar**: 1
- **Archivos a modificar**: 4
- **Funcionalidad preservada**: 100%
- **Tiempo estimado**: ~25 minutos

