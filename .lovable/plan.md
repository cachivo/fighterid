

# Plan: Récords Separados por Disciplina + Acceso Tablet

## Resumen

Implementar récords de pelea independientes por disciplina (MMA y Boxeo), donde cada sección de récord solo aparece si el peleador tiene esa disciplina seleccionada. Diseño extensible para futuras disciplinas.

---

## Parte 1: Base de Datos

### Nuevas Columnas en `fighter_profiles`

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `mma_record_wins` | integer | 0 | Victorias en MMA |
| `mma_record_losses` | integer | 0 | Derrotas en MMA |
| `mma_record_draws` | integer | 0 | Empates en MMA |
| `boxeo_record_wins` | integer | 0 | Victorias en Boxeo |
| `boxeo_record_losses` | integer | 0 | Derrotas en Boxeo |
| `boxeo_record_draws` | integer | 0 | Empates en Boxeo |

### Migración SQL

```sql
-- Agregar columnas para récords por disciplina
ALTER TABLE fighter_profiles 
ADD COLUMN mma_record_wins integer DEFAULT 0,
ADD COLUMN mma_record_losses integer DEFAULT 0,
ADD COLUMN mma_record_draws integer DEFAULT 0,
ADD COLUMN boxeo_record_wins integer DEFAULT 0,
ADD COLUMN boxeo_record_losses integer DEFAULT 0,
ADD COLUMN boxeo_record_draws integer DEFAULT 0;

-- Migrar datos existentes a MMA (todos actuales son MMA)
UPDATE fighter_profiles 
SET 
  mma_record_wins = COALESCE(record_wins, 0),
  mma_record_losses = COALESCE(record_losses, 0),
  mma_record_draws = COALESCE(record_draws, 0);
```

### Actualizar Función `admin_update_fighter_profile`

Agregar manejo de los nuevos campos en la función RPC.

---

## Parte 2: UI del Panel Admin - Lógica Condicional

### FighterEditModal.tsx - Récords Dinámicos

La sección de récord muestra cards según las disciplinas seleccionadas:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Récord de Combate                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Si tiene MMA seleccionado:                                     │
│  ┌─────────────────────┐                                        │
│  │ 🥊 RÉCORD MMA       │                                        │
│  │ V: [ 5 ] D: [ 2 ] E: [ 0 ]                                  │
│  │ Record: 5-2-0       │                                        │
│  └─────────────────────┘                                        │
│                                                                 │
│  Si tiene Boxeo seleccionado:                                   │
│  ┌─────────────────────┐                                        │
│  │ 🥊 RÉCORD BOXEO     │                                        │
│  │ V: [ 3 ] D: [ 1 ] E: [ 0 ]                                  │
│  │ Record: 3-1-0       │                                        │
│  └─────────────────────┘                                        │
│                                                                 │
│  Si no tiene ninguna disciplina:                                │
│  [Mensaje: Selecciona una disciplina para editar récords]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Código de Ejemplo

```tsx
{/* MMA Record - Solo si MMA está seleccionado */}
{formData.martial_arts?.includes('MMA') && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <span>🥊</span> Récord MMA
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Victorias</Label>
          <Input type="number" value={formData.mma_record_wins} ... />
        </div>
        <div>
          <Label>Derrotas</Label>
          <Input type="number" value={formData.mma_record_losses} ... />
        </div>
        <div>
          <Label>Empates</Label>
          <Input type="number" value={formData.mma_record_draws} ... />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Record: {formData.mma_record_wins}-{formData.mma_record_losses}-{formData.mma_record_draws}
      </p>
    </CardContent>
  </Card>
)}

{/* Boxeo Record - Solo si Boxeo está seleccionado */}
{formData.martial_arts?.includes('Boxeo') && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <span>🥊</span> Récord Boxeo
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Mismo patrón */}
    </CardContent>
  </Card>
)}

{/* Mensaje si no hay disciplina */}
{(!formData.martial_arts || formData.martial_arts.length === 0) && (
  <div className="text-center p-6 text-muted-foreground">
    Selecciona una disciplina en la sección anterior para editar récords
  </div>
)}
```

---

## Parte 3: Actualizar Tipos TypeScript

### useFighterProfiles.tsx

```typescript
export interface FighterProfile {
  // ... campos existentes
  
  // Récords por disciplina
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
}

export interface AdminFighterFormData {
  // ... campos existentes
  
  // Récords por disciplina
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
}
```

---

## Parte 4: Habilitar Tablets

### AdminLayout.tsx

Cambiar breakpoints de `lg:` (1024px) a `md:` (768px):

```tsx
// ANTES
<div className="lg:hidden min-h-screen ...">
<div className="hidden lg:flex min-h-screen ...">

// DESPUÉS
<div className="md:hidden min-h-screen ...">
<div className="hidden md:flex min-h-screen ...">
```

---

## Parte 5: Estandarizar Constantes en FighterEditModal

### Eliminar constantes locales (líneas 21-36)

```typescript
// ELIMINAR estas líneas con valores en inglés:
const WEIGHT_CLASSES = ['Strawweight', ...];
const MARTIAL_ARTS = ['MMA', 'Boxeo', 'Judo', ...];
const FIGHTER_LEVELS = [{ value: 'AMATEUR', ... }];
```

### Importar constantes centralizadas

```typescript
import { 
  ENABLED_DISCIPLINES, 
  WEIGHT_CLASSES, 
  FIGHTER_LEVELS, 
  STANCES 
} from '@/lib/constants/disciplines';
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| **Migración SQL** | 6 columnas nuevas + migración datos |
| **DB Function** | Actualizar `admin_update_fighter_profile` |
| `src/hooks/useFighterProfiles.tsx` | Agregar tipos para nuevos campos |
| `src/components/admin/FighterEditModal.tsx` | UI condicional por disciplina + constantes |
| `src/components/admin/AdminFighterForm.tsx` | UI condicional por disciplina |
| `src/components/AdminLayout.tsx` | Cambiar `lg:` → `md:` |

---

## Resultado Final

```text
Peleador: Juan "El Tigre" Pérez
Disciplinas: [MMA] [Boxeo]

┌─────────────────────┐    ┌─────────────────────┐
│ 🥊 RÉCORD MMA       │    │ 🥊 RÉCORD BOXEO     │
│ 5-2-0               │    │ 3-1-0               │
└─────────────────────┘    └─────────────────────┘

---

Peleador: María "La Tigresa" López
Disciplinas: [MMA]

┌─────────────────────┐
│ 🥊 RÉCORD MMA       │
│ 8-0-0               │  ← Solo MMA (no tiene Boxeo)
└─────────────────────┘
```

---

## Extensibilidad Futura

La estructura permite agregar nuevas disciplinas fácilmente:

```sql
-- Futuro: Kickboxing
ALTER TABLE fighter_profiles 
ADD COLUMN kickboxing_record_wins integer DEFAULT 0,
ADD COLUMN kickboxing_record_losses integer DEFAULT 0,
ADD COLUMN kickboxing_record_draws integer DEFAULT 0;

-- Futuro: Muay Thai
ALTER TABLE fighter_profiles 
ADD COLUMN muaythai_record_wins integer DEFAULT 0,
...
```

Solo requiere:
1. Agregar columnas a la base de datos
2. Agregar disciplina a `ENABLED_DISCIPLINES`
3. Agregar card condicional en los formularios

