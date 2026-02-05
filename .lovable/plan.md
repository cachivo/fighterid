
# Plan: Correccion de UI Rankings en Pagina Principal

## Problemas Identificados

### 1. Tab "Todos" que mezcla niveles
**Ubicacion:** `src/components/sections/Ranking.tsx` lineas 132-137

```typescript
// ACTUAL - Linea 132-137
<TabsTrigger value="all" ...>
  Todos
</TabsTrigger>
```

**Correccion:** Eliminar este tab y seleccionar automaticamente el primer nivel disponible.

### 2. Record de peleadores no visible
**Ubicacion:** `src/hooks/useOrganizationRanking.tsx` lineas 63-69

El SELECT actual solo trae datos basicos del peleador:
```typescript
fighter_profiles!inner (
  first_name,
  last_name,
  nickname,
  avatar_url,
  country
)
```

**Falta agregar:** Los campos de record segun disciplina:
- MMA: `mma_record_wins`, `mma_record_losses`, `mma_record_draws`
- Boxeo: `boxeo_record_wins`, `boxeo_record_losses`, `boxeo_record_draws`

---

## Solucion Tecnica

### Archivo 1: `src/hooks/useOrganizationRanking.tsx`

**Cambios:**
1. Agregar campos de record al SELECT de fighter_profiles
2. Agregar la disciplina de la organizacion al retorno para saber cual record mostrar

```typescript
// Nuevo interface RankingEntry
export interface RankingEntry {
  // ... campos existentes ...
  fighter: {
    first_name: string;
    last_name: string;
    nickname: string | null;
    avatar_url: string | null;
    country: string | null;
    // NUEVOS campos de record
    mma_record_wins: number | null;
    mma_record_losses: number | null;
    mma_record_draws: number | null;
    boxeo_record_wins: number | null;
    boxeo_record_losses: number | null;
    boxeo_record_draws: number | null;
  };
}

// Agregar discipline al resultado
export interface OrganizationRankingResult {
  // ... campos existentes ...
  discipline: 'MMA' | 'Boxeo'; // NUEVO
}
```

### Archivo 2: `src/components/sections/Ranking.tsx`

**Cambios:**

1. **Eliminar tab "Todos"** - lineas 132-137
2. **Inicializar con primer nivel disponible** - cambiar `useState<string>('all')` por logica dinamica
3. **Mostrar record** - agregar columna de record en cada card de peleador

```typescript
// ANTES
const [selectedLevel, setSelectedLevel] = useState<string>('all');

// DESPUES
const [selectedLevel, setSelectedLevel] = useState<string>('');

// Efecto para seleccionar primer nivel cuando carga
useEffect(() => {
  if (availableLevels.length > 0 && !selectedLevel) {
    setSelectedLevel(availableLevels[0]);
  }
}, [availableLevels, selectedLevel]);
```

**Mostrar record segun disciplina:**
```typescript
// En cada card de peleador
const wins = rankingData?.discipline === 'MMA' 
  ? ranking.fighter.mma_record_wins 
  : ranking.fighter.boxeo_record_wins;
const losses = rankingData?.discipline === 'MMA'
  ? ranking.fighter.mma_record_losses
  : ranking.fighter.boxeo_record_losses;
const draws = rankingData?.discipline === 'MMA'
  ? ranking.fighter.mma_record_draws
  : ranking.fighter.boxeo_record_draws;

// Mostrar como: "5-2-0" o "W-L-D"
<span className="text-green-400">{wins || 0}</span>
<span>-</span>
<span className="text-red-400">{losses || 0}</span>
<span>-</span>
<span className="text-gray-400">{draws || 0}</span>
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useOrganizationRanking.tsx` | Agregar campos de record al SELECT, incluir discipline en resultado |
| `src/components/sections/Ranking.tsx` | Eliminar tab "Todos", mostrar record, auto-seleccionar primer nivel |

---

## Resultado Visual Esperado

**ANTES:**
```
[Todos] [Pro] [Semi] [Amateur]

#1 Fighter Name
   Peso Ligero | Amateur
   15 pts
```

**DESPUES:**
```
[Pro] [Semi] [Amateur]   <-- Sin "Todos"

#1 Fighter Name          5-2-0   <-- Record visible
   Peso Ligero | Amateur
   15 pts
```

---

## Seccion Tecnica

### Logica de seleccion de record

La disciplina se determina por la organizacion:
- `UCC_MMA` → discipline = 'MMA' → usar `mma_record_*`
- `BDG_PRO` → discipline = 'Boxeo' → usar `boxeo_record_*`  
- `HHF_AMATEUR` → discipline = 'Boxeo' → usar `boxeo_record_*`

Esta informacion ya existe en la tabla `ranking_organizations.discipline`, solo necesitamos propagarla al frontend.
