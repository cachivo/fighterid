

# Plan: Sincronización Completa de Cambios de Nivel

## Problema Identificado

La sincronización de cambios de nivel funciona correctamente a nivel de base de datos (bidireccional entre `fighter_profiles` y `fighter_rankings`), pero **faltan suscripciones realtime** en:

1. **Componente de Ranking en Homepage** (`src/components/sections/Ranking.tsx`)
2. **Página pública de Peleadores** (`src/pages/Fighters.tsx`)

## Solución Propuesta

### Archivo 1: `src/components/sections/Ranking.tsx`

Agregar hooks de realtime para sincronización automática:

```tsx
// Importar al inicio
import { useRealtimeFighterUpdates, useRealtimeRankingUpdates } from '@/hooks/useRealtimeFighterUpdates';

// Dentro del componente, después de los estados existentes
const Ranking = ({ organizationCode = 'UCC_MMA' }: RankingProps) => {
  // ... estados existentes ...
  
  // NUEVO: Suscripción realtime para cambios en perfiles y rankings
  useRealtimeFighterUpdates();
  useRealtimeRankingUpdates();
  
  // ... resto del componente ...
};
```

### Archivo 2: `src/pages/Fighters.tsx`

Agregar hook de realtime para actualización automática de la lista:

```tsx
// Importar al inicio
import { useRealtimeFighterUpdates } from '@/hooks/useRealtimeFighterUpdates';

// Dentro del componente
export default function Fighters() {
  // ... estados existentes ...
  const { fighters, loading, ... } = useFighterProfiles();
  
  // NUEVO: Suscripción realtime para cambios en perfiles
  useRealtimeFighterUpdates();
  
  // ... resto del componente ...
};
```

## Flujo de Sincronización Resultante

```text
+----------------------+      +---------------------+      +------------------+
|   Admin cambia       |      |     Base de Datos   |      |   Frontend       |
|   nivel peleador     | ---> |  (RPC actualiza     | ---> |  (Realtime       |
|   (Rankings Admin)   |      |   profiles+rankings)|      |   invalida cache)|
+----------------------+      +---------------------+      +------------------+
                                       |
                                       v
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
     +----------------+      +------------------+      +-----------------+
     | Homepage       |      | Admin Rankings   |      | Fighters Page   |
     | Ranking        |      | Management       |      | (lista pública) |
     | (actualiza)    |      | (actualiza)      |      | (actualiza)     |
     +----------------+      +------------------+      +-----------------+
```

## Optimización para Móviles de Gama Baja

Las suscripciones realtime de Supabase son ligeras y no impactan el rendimiento:
- Usan WebSockets (conexión persistente, bajo overhead)
- Solo invalidan queries cuando hay cambios reales
- No re-renderizan si los datos no cambian

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Agregar `useRealtimeFighterUpdates()` y `useRealtimeRankingUpdates()` |
| `src/pages/Fighters.tsx` | Agregar `useRealtimeFighterUpdates()` |

## Verificación Post-Implementación

1. Abrir página principal en una pestaña
2. Abrir admin panel en otra pestaña
3. En admin: cambiar nivel de un peleador (ej: Amateur → Profesional)
4. Verificar que la página principal muestra el cambio sin refrescar
5. Ir a /fighters y verificar que el nivel actualizado aparece correctamente

## Resumen Técnico

- **Problema**: Falta de suscripciones realtime en componentes públicos
- **Solución**: Agregar hooks `useRealtimeFighterUpdates` y `useRealtimeRankingUpdates`
- **Impacto**: Sincronización instantánea en toda la plataforma
- **Costo**: Mínimo (2 líneas de código por archivo)

