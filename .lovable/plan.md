
# Plan: Rankings Separados por Disciplina

## Resumen

Modificar el sistema de ranking para filtrar peleadores por disciplina. Por defecto mostrará solo **MMA**, con opción de ver otras disciplinas mediante tabs.

---

## Cambios Propuestos

### 1. Hook `useFighterRanking.tsx`

Agregar parámetro `discipline` para filtrar:

```typescript
// ANTES
export function useFighterRanking(minFights: number = 3, page: number = 1, pageSize: number = 10)

// DESPUÉS  
export function useFighterRanking(
  discipline: string = 'MMA',  // Nueva - por defecto MMA
  minFights: number = 3, 
  page: number = 1, 
  pageSize: number = 10
)
```

**Query modificada:**
```typescript
const { data, error } = await supabase
  .from('fighter_profiles')
  .select('...')
  .eq('active', true)
  .eq('discipline', discipline)  // Filtrar por disciplina
  .order('record_wins', { ascending: false });
```

**Stats también filtrados por disciplina:**
```typescript
const { data: allFighters } = await supabase
  .from('fighter_profiles')
  .select('...')
  .eq('active', true)
  .eq('discipline', discipline);  // Stats solo de esa disciplina
```

---

### 2. Componente `Ranking.tsx`

Agregar tabs para seleccionar disciplina:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Top Peleadores Ranking                                         │
│                                                                 │
│  ┌─────────┐  ┌─────────┐                                      │
│  │   MMA   │  │  Boxeo  │   ← Tabs de disciplina               │
│  └─────────┘  └─────────┘     (MMA activo por defecto)         │
│                                                                 │
│  #1 🏆 Juan Pérez        5-2-0  MMA           13 pts           │
│  #2    María López       3-0-1  MMA           10 pts           │
│  #3    Pedro Rodríguez   4-3-0  MMA            9 pts           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Código de tabs:**
```tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENABLED_DISCIPLINES } from "@/lib/constants/disciplines";

const [selectedDiscipline, setSelectedDiscipline] = useState('MMA');

// Reset page y fighters al cambiar disciplina
useEffect(() => {
  setPage(1);
  setAllFighters([]);
}, [selectedDiscipline]);

const { fighters, stats, isLoading, hasMore } = useFighterRanking(
  selectedDiscipline,  // Pasar disciplina seleccionada
  3, 
  page, 
  PAGE_SIZE
);

// En el JSX
<Tabs value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
  <TabsList className="bg-black/60 border border-purple-neon-primary/30">
    {ENABLED_DISCIPLINES.map(d => (
      <TabsTrigger key={d.value} value={d.value}>
        {d.value}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

---

### 3. Estadísticas por Disciplina

Las 4 tarjetas de estadísticas también se filtrarán por la disciplina seleccionada:

| Disciplina | Peleadores | Peleas | Profesionales | Invictos |
|------------|------------|--------|---------------|----------|
| MMA        | 45         | 120    | 28            | 5        |
| Boxeo      | 23         | 67     | 15            | 3        |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useFighterRanking.tsx` | Agregar parámetro `discipline` y filtrar queries |
| `src/components/sections/Ranking.tsx` | Agregar tabs y estado de disciplina |

---

## Resultado Visual

```text
┌─────────────────────────────────────────────────────────────────┐
│           NUESTROS RESULTADOS                                   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │    45    │ │   120    │ │    28    │ │     5    │          │
│  │Peleadores│ │  Peleas  │ │  Profes  │ │ Invictos │          │
│  │   MMA    │ │   MMA    │ │   MMA    │ │   MMA    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  Top Peleadores Ranking                                         │
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐                           │
│  │      MMA      │ │     Boxeo     │                           │
│  │   (activo)    │ │               │                           │
│  └───────────────┘ └───────────────┘                           │
│                                                                 │
│  #1 🏆 Peleador MMA #1     5-2-0           13 pts              │
│  #2    Peleador MMA #2     3-0-1           10 pts              │
│  #3    Peleador MMA #3     4-3-0            9 pts              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Beneficios

1. **Rankings justos**: Cada disciplina tiene su propio ranking
2. **Estadísticas precisas**: Métricas específicas por deporte
3. **Escalable**: Fácil agregar más disciplinas en el futuro
4. **UX clara**: Usuario elige qué ranking ver
