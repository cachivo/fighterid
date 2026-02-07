
# Plan: Mejoras al Sistema de Rankings - Filtros Avanzados y Nivel Predeterminado Pro

## Resumen Ejecutivo

Se implementarán mejoras en la página principal de rankings para:
1. Establecer "Profesional" como nivel predeterminado
2. Agregar filtro por categoría de peso
3. Agregar filtro por género (Masculino/Femenino)
4. Garantizar separación absoluta entre récords de MMA y Boxeo

---

## Estado Actual

### Distribución de Datos en la Base de Datos

| Campo | Valores | Cantidad |
|-------|---------|----------|
| **Disciplina** | MMA: 55, Boxeo: 9 | 64 total |
| **Nivel** | Amateur: 44, Pro: 11, Semi: 9 | 64 total |
| **Género** | Masculino: 53, Femenino: 7, Sin definir: 4 | 64 total |
| **Categorías de peso** | 8 categorías activas | Peso Mosca lidera con 17 |

### Organizaciones de Ranking

| Código | Disciplina | Niveles Permitidos |
|--------|------------|-------------------|
| UCC_MMA | MMA | Pro, Semi, Amateur |
| BDG_PRO | Boxeo | Pro, Semi |
| HHF_AMATEUR | Boxeo | Amateur |

### Comportamiento Actual vs Deseado

| Aspecto | Actual | Deseado |
|---------|--------|---------|
| Nivel por defecto | El que tenga más peleadores | **Profesional** (si existe) |
| Filtro de peso | No visible | **Selector activo** |
| Filtro de género | No existe | **Selector activo** |
| Récords por disciplina | Separados correctamente | Mantener separación |

---

## Cambios Técnicos

### Archivo 1: `src/hooks/useOrganizationRanking.tsx`

**Objetivo**: Agregar `gender` a la consulta y exponer filtros adicionales

```tsx
// Cambios en la interfaz RankingEntry
export interface RankingEntry {
  // ... campos existentes ...
  fighter: {
    // ... campos existentes ...
    gender: string | null; // NUEVO
  };
}

// Cambios en la consulta SELECT
fighter_profiles!inner (
  // ... campos existentes ...
  gender  // NUEVO
)

// Nuevos parámetros en la función
export function useOrganizationRanking(
  organizationCode: string,
  level?: string,
  weightClass?: string,
  gender?: string,  // NUEVO
  page: number = 1,
  pageSize: number = 10
)

// Nuevo filtro en la consulta
if (gender) {
  query = query.eq('fighter_profiles.gender', gender);
}

// Nuevo campo en el resultado
export interface OrganizationRankingResult {
  // ... campos existentes ...
  genders: string[];  // NUEVO: ['M', 'F']
}
```

### Archivo 2: `src/components/sections/Ranking.tsx`

**Objetivo**: UI de filtros y cambio de nivel predeterminado

```tsx
// 1. NUEVOS ESTADOS
const [selectedWeightClass, setSelectedWeightClass] = useState<string>('');
const [selectedGender, setSelectedGender] = useState<string>('');

// 2. NUEVO HOOK CALL CON FILTROS
const { data: rankingData, isLoading } = useOrganizationRanking(
  organizationCode,
  selectedLevel || undefined,
  selectedWeightClass || undefined,
  selectedGender || undefined,  // NUEVO
  page,
  PAGE_SIZE
);

// 3. CAMBIAR LÓGICA DE NIVEL PREDETERMINADO
useEffect(() => {
  if (availableLevels.length > 0 && !selectedLevel) {
    // NUEVO: Priorizar "Profesional" si existe
    if (availableLevels.includes('Profesional')) {
      setSelectedLevel('Profesional');
    } else if (availableLevels.includes('Semi-profesional')) {
      setSelectedLevel('Semi-profesional');
    } else {
      setSelectedLevel(availableLevels[0]);
    }
  }
}, [availableLevels, selectedLevel]);

// 4. NUEVA UI DE FILTROS (debajo de tabs de nivel)
<div className="flex flex-wrap justify-center gap-2 mb-4">
  {/* Filtro de Peso */}
  <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
    <SelectTrigger className="w-[140px] xs:w-[160px] bg-black/60 border-purple-neon-primary/30 h-9 text-xs">
      <SelectValue placeholder="División: Todas" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Todas las divisiones</SelectItem>
      {weightClasses.map(wc => (
        <SelectItem key={wc} value={wc}>{getWeightClassLabel(wc)}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Filtro de Género */}
  <Select value={selectedGender} onValueChange={setSelectedGender}>
    <SelectTrigger className="w-[120px] xs:w-[140px] bg-black/60 border-purple-neon-primary/30 h-9 text-xs">
      <SelectValue placeholder="Género: Todos" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Todos</SelectItem>
      <SelectItem value="M">Masculino</SelectItem>
      <SelectItem value="F">Femenino</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Archivo 3: `src/lib/constants/disciplines.ts`

**Objetivo**: Centralizar constantes de género para consistencia

```tsx
// Agregar al final del archivo
export const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
] as const;

export type Gender = typeof GENDERS[number]['value'];
```

---

## Arquitectura de Separación de Récords (Ya Implementada)

La función `getRecordWithFallback` en `Ranking.tsx` ya garantiza la separación correcta:

```text
+------------------+     +----------------------+
|   Organización   |     |   Récord Mostrado    |
+------------------+     +----------------------+
| UCC_MMA          | --> | mma_record_*         |
| BDG_PRO (Boxeo)  | --> | boxeo_record_*       |
| HHF_AMATEUR      | --> | boxeo_record_*       |
+------------------+     +----------------------+
```

**Regla**: El récord mostrado siempre corresponde a la disciplina de la organización seleccionada. Un peleador con MMA 5-2-0 y Boxeo 3-1-0 mostrará el récord apropiado según el ranking que esté viendo.

---

## Optimización Móvil

Todos los nuevos elementos seguirán los estándares establecidos:

- Selectores con `min-h-[44px]` para touch targets
- Clases responsive `xs:`, `sm:`, `md:`
- `touch-manipulation` en elementos interactivos
- `truncate` y `line-clamp-1` para textos largos
- Diseño que fluye verticalmente en pantallas pequeñas

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useOrganizationRanking.tsx` | Agregar gender a consulta y filtros |
| `src/components/sections/Ranking.tsx` | UI de filtros + lógica nivel Pro |
| `src/lib/constants/disciplines.ts` | Centralizar constantes GENDERS |

---

## Flujo de Usuario Final

1. Usuario abre la página principal
2. Selecciona disciplina (MMA o Boxeo)
3. Ve automáticamente el ranking **Profesional** (si existe)
4. Puede filtrar por:
   - Nivel (Pro/Semi/Amateur)
   - División de peso (Mosca, Ligero, etc.)
   - Género (Masculino/Femenino)
5. Los récords mostrados corresponden **únicamente** a la disciplina seleccionada

---

## Verificación Post-Implementación

1. Abrir página principal como usuario autenticado
2. Verificar que MMA muestra nivel "Pro" por defecto
3. Cambiar a Boxeo y verificar nivel por defecto
4. Usar filtro de peso y confirmar que filtra correctamente
5. Usar filtro de género y confirmar que filtra correctamente
6. Verificar que un peleador con récords en ambas disciplinas muestra el correcto
