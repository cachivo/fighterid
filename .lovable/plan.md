
# Análisis de Coherencia: Fighter ID Platform

## Resumen Ejecutivo

Se identificaron **12 inconsistencias críticas** entre la página principal, el explorador de atletas, y el panel de administración. Estas inconsistencias afectan la integridad de datos y la experiencia del usuario.

---

## INCONSISTENCIA #1: Disciplinas de Competencia vs Artes Marciales

### Problema

El archivo `disciplines.ts` define correctamente la separación:
- **ENABLED_DISCIPLINES** = [MMA, Boxeo] → Para competencia
- **MARTIAL_ARTS_TRAINING** = [MuayThai, JiuJitsu, Judo, etc.] → Para entrenamiento

Sin embargo, `Fighters.tsx` (explorador público) **mezcla ambos conceptos**:

```typescript
// Fighters.tsx líneas 46-56 - INCORRECTO
const DISCIPLINES = [
  'Todas', 'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 
  'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
];
```

### Ubicación del Problema

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/lib/constants/disciplines.ts` | ✅ Correcto | Separa disciplinas de competencia y artes de entrenamiento |
| `src/pages/Fighters.tsx` | ❌ Incorrecto | Mezcla ambos conceptos en el filtro "Disciplina" |
| `src/components/sections/LeagueSelector.tsx` | ✅ Correcto | Solo muestra MMA y Boxeo |
| `src/pages/admin/FightersProfiles.tsx` | ✅ Correcto | Usa `ENABLED_DISCIPLINES` |

### Corrección Necesaria

```typescript
// Fighters.tsx - Usar constantes centralizadas
import { ENABLED_DISCIPLINES, MARTIAL_ARTS_TRAINING } from '@/lib/constants/disciplines';

// Cambiar filtro "Disciplina" a solo competencia
const DISCIPLINES = [
  { value: 'Todas', label: 'Todas' },
  ...ENABLED_DISCIPLINES.map(d => ({ value: d.value, label: d.label }))
];

// Agregar nuevo filtro "Artes Marciales" para entrenamiento
const MARTIAL_ARTS_OPTIONS = [
  { value: 'Todos', label: 'Todas' },
  ...MARTIAL_ARTS_TRAINING.map(m => ({ value: m.value, label: m.label }))
];
```

---

## INCONSISTENCIA #2: Récords de Combate (Legacy vs Por Disciplina)

### Problema

El sistema tiene dos formas de almacenar récords:

```text
CAMPOS LEGACY (Deprecated):
- record_wins, record_losses, record_draws

CAMPOS POR DISCIPLINA (Correcto):
- mma_record_wins, mma_record_losses, mma_record_draws
- boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
```

**Pero diferentes componentes usan diferentes campos:**

| Componente | Campos Usados | Estado |
|------------|---------------|--------|
| `Ranking.tsx` (homepage) | `mma_record_*` / `boxeo_record_*` | ✅ Correcto |
| `FightersProfiles.tsx` (admin) | `getRecordDisplay()` con disciplina | ✅ Correcto |
| `FighterCard.tsx` (explorer) | `record_wins` (legacy) | ❌ Incorrecto |
| `useCombinedFighterRecord.tsx` | `record_wins` (legacy) | ❌ Incorrecto |
| `FighterProfile.tsx` | `useCombinedFighterRecord` | ❌ Incorrecto |

### Código Problemático

```typescript
// FighterCard.tsx línea 33 y 98 - USA LEGACY
const totalFights = fighter.record_wins + fighter.record_losses + fighter.record_draws;
// ...
{fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}

// useCombinedFighterRecord.tsx líneas 22-23 - USA LEGACY
.select('record_wins, record_losses, record_draws, record_type')
```

### Corrección Necesaria

```typescript
// FighterCard.tsx - Usar disciplina
const getRecordForDiscipline = (fighter: FighterProfile) => {
  if (fighter.discipline === 'MMA') {
    return {
      wins: fighter.mma_record_wins || 0,
      losses: fighter.mma_record_losses || 0,
      draws: fighter.mma_record_draws || 0
    };
  } else if (fighter.discipline === 'Boxeo') {
    return {
      wins: fighter.boxeo_record_wins || 0,
      losses: fighter.boxeo_record_losses || 0,
      draws: fighter.boxeo_record_draws || 0
    };
  }
  // Fallback a legacy
  return {
    wins: fighter.record_wins,
    losses: fighter.record_losses,
    draws: fighter.record_draws
  };
};

// useCombinedFighterRecord.tsx - Agregar campos por disciplina
.select('record_wins, record_losses, record_draws, record_type, mma_record_wins, mma_record_losses, mma_record_draws, boxeo_record_wins, boxeo_record_losses, boxeo_record_draws, discipline')
```

---

## INCONSISTENCIA #3: Filtro "Estilo de Pelea"

### Problema

El filtro mezcla **estilos de combate** con **nombres de gimnasios**:

```typescript
// Fighters.tsx líneas 58-67 - COMPLETAMENTE INCORRECTO
const FIGHTING_STYLES = [
  'Todos',
  'Striker',           // ✅ Estilo de pelea
  'Brawler/Agresivo',  // ✅ Estilo de pelea
  'Contra-Atacador',   // ✅ Estilo de pelea
  'LUDUS CERBERUS',    // ❌ GIMNASIO!
  'ALFA Y OMEGA MMA',  // ❌ GIMNASIO!
  'SCHUMMANS/COMAYAGUA', // ❌ GIMNASIO!
  'TEMPLO DEL TIGRE'   // ❌ GIMNASIO!
];
```

### Corrección Necesaria

```typescript
// Separar estilos de gimnasios
const FIGHTING_STYLES = [
  'Todos',
  'Striker',
  'Brawler/Agresivo', 
  'Contra-Atacador',
  'Grappler',
  'Wrestler',
  'Switch/Híbrido'
];

// El filtro de gimnasio debería usar datos dinámicos de la DB
// o crear un filtro separado
```

---

## INCONSISTENCIA #4: Visualización de Record en FighterProfile.tsx

### Problema

El perfil público del peleador usa `useCombinedFighterRecord` que:
1. Solo usa campos legacy (`record_wins`, etc.)
2. No distingue por disciplina de competencia
3. Combina récords de peleas registradas con manual sin considerar la disciplina

```typescript
// FighterProfile.tsx líneas 163-173
<Tabs value={recordType} onValueChange={(value) => setRecordType(value as RecordType)}>
  <TabsTrigger value="AMATEUR">Amateur</TabsTrigger>
  <TabsTrigger value="PROFESSIONAL">Profesional</TabsTrigger>
</Tabs>
```

**El toggle es Amateur/Profesional pero debería ser por DISCIPLINA:**

```text
LÓGICA ACTUAL:           LÓGICA CORRECTA:
┌─────────────────────┐  ┌─────────────────────┐
│ Amateur │ Pro      │  │ MMA │ Boxeo        │
└─────────────────────┘  └─────────────────────┘
(basado en record_type)   (basado en discipline)
```

### Corrección Propuesta

El perfil debe mostrar el récord según la **disciplina de competencia** del peleador, no según Amateur/Pro:

```typescript
// Si el peleador compite en MMA:
- Mostrar: mma_record_wins-mma_record_losses-mma_record_draws

// Si el peleador compite en Boxeo:
- Mostrar: boxeo_record_wins-boxeo_record_losses-boxeo_record_draws

// El level (Amateur/Pro) es informativo, no define el récord
```

---

## INCONSISTENCIA #5: Artes Marciales en FighterCard

### Problema

```typescript
// FighterCard.tsx líneas 101-119
{fighter.martial_arts && fighter.martial_arts.length > 0 
  ? fighter.martial_arts.map(art => (
      <Badge>{art}</Badge>
    ))
  : fighter.discipline && (
      <Badge>{fighter.discipline}</Badge>
    )
}
```

Esto muestra:
- Si tiene `martial_arts`: Muestra artes de entrenamiento
- Si no tiene `martial_arts`: Muestra disciplina de competencia

**Ambos se muestran bajo "Artes Marciales"** - confuso porque son conceptos diferentes.

### Corrección Necesaria

```typescript
// Separar claramente
<div>
  <p className="text-muted-foreground">Compite en</p>
  <Badge>{fighter.discipline || 'N/A'}</Badge>
</div>

{fighter.martial_arts && fighter.martial_arts.length > 0 && (
  <div>
    <p className="text-muted-foreground">Entrena</p>
    {fighter.martial_arts.map(art => (
      <Badge key={art} variant="outline">{art}</Badge>
    ))}
  </div>
)}
```

---

## MAPA DE COHERENCIA

```text
                    ┌────────────────────────┐
                    │   disciplines.ts       │
                    │ ✅ ENABLED_DISCIPLINES │
                    │ ✅ MARTIAL_ARTS_TRAINING│
                    └───────────┬────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ LeagueSelector   │  │ Fighters.tsx     │  │ Admin Profiles   │
│ ✅ Solo MMA/Boxeo│  │ ❌ 8 disciplinas │  │ ✅ Solo MMA/Boxeo│
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Ranking.tsx      │  │ FighterCard.tsx  │  │ FightersProfiles │
│ ✅ Records x disc│  │ ❌ Records legacy│  │ ✅ Records x disc│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## ARCHIVOS A MODIFICAR

| Archivo | Prioridad | Cambios |
|---------|-----------|---------|
| `src/pages/Fighters.tsx` | ALTA | Usar `ENABLED_DISCIPLINES`, corregir `FIGHTING_STYLES` |
| `src/components/FighterCard.tsx` | ALTA | Usar records por disciplina, separar "Compite en" vs "Entrena" |
| `src/hooks/useCombinedFighterRecord.tsx` | ALTA | Agregar campos por disciplina |
| `src/pages/FighterProfile.tsx` | MEDIA | Mostrar record según disciplina, no Amateur/Pro |

---

## MATRIZ DE VERIFICACIÓN POST-CORRECCIÓN

| Área | Verificación |
|------|-------------|
| Disciplina en filtros | Solo MMA y Boxeo como opciones de competencia |
| Artes marciales | Separadas como filtro de "entrenamiento" |
| Récords en cards | Mostrar según disciplina del peleador |
| Récords en perfil | Basado en disciplina, no Amateur/Pro |
| Estilos de pelea | Solo estilos reales, no gimnasios |
| Consistencia Admin↔Público | Mismos campos y lógica |

---

## IMPLEMENTACIÓN RECOMENDADA

### Fase 1: Normalizar Filtros en Explorer (1 archivo)
1. Modificar `Fighters.tsx` para usar constantes de `disciplines.ts`
2. Corregir `FIGHTING_STYLES` eliminando gimnasios

### Fase 2: Unificar Récords (3 archivos)
1. Actualizar `FighterCard.tsx` con función `getRecordForDiscipline()`
2. Actualizar `useCombinedFighterRecord.tsx` para usar campos por disciplina
3. Actualizar `FighterProfile.tsx` para mostrar récord según disciplina

### Fase 3: Clarificar UI (2 archivos)
1. Separar "Compite en" vs "Entrena" en `FighterCard.tsx`
2. Ajustar labels en `FighterProfile.tsx`
