

# Plan: Garantizar Lista Cargada en Ranking

## Problema Identificado

El componente `Ranking.tsx` tiene un problema de sincronización:

1. **Estado inicial vacío**: `selectedLevel` comienza como `''` (cadena vacía)
2. **useEffect asíncrono**: El nivel predeterminado solo se establece DESPUÉS de que `availableLevels` se carga
3. **Query ejecuta antes**: La consulta se ejecuta con `selectedLevel = ''` antes de que el efecto seleccione un nivel
4. **Nivel sin datos**: Si el nivel predeterminado (ej: "Profesional") no tiene peleadores en cierta organización, se muestra vacío

### Escenarios Problemáticos

| Organización | Profesional | Semi | Amateur | Comportamiento Actual |
|--------------|-------------|------|---------|----------------------|
| UCC_MMA | 9 | 7 | 39 | OK (muestra Pro) |
| BDG_PRO | 2 | 1 | 0 | OK (muestra Pro) |
| HHF_AMATEUR | 0 | 0 | 6 | FALLA (muestra vacío porque intenta "Pro" primero) |

---

## Solución

### 1. Selección Inteligente del Nivel por Defecto

Usar `levelCounts` que ya viene del hook para elegir el nivel con más peleadores como fallback:

```tsx
// En lugar de priorizar siempre "Profesional"
useEffect(() => {
  if (availableLevels.length > 0 && !selectedLevel) {
    const levelCounts = rankingData?.levelCounts || {};
    
    // Prioridad: Profesional > Semi-profesional > Amateur > Mayor población
    if (availableLevels.includes('Profesional') && (levelCounts['Profesional'] || 0) > 0) {
      setSelectedLevel('Profesional');
    } else if (availableLevels.includes('Semi-profesional') && (levelCounts['Semi-profesional'] || 0) > 0) {
      setSelectedLevel('Semi-profesional');
    } else if (availableLevels.includes('Amateur') && (levelCounts['Amateur'] || 0) > 0) {
      setSelectedLevel('Amateur');
    } else {
      // Fallback: nivel con más peleadores
      const bestLevel = Object.entries(levelCounts)
        .filter(([level]) => availableLevels.includes(level))
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      setSelectedLevel(bestLevel || availableLevels[0]);
    }
  }
}, [availableLevels, selectedLevel, rankingData?.levelCounts]);
```

### 2. Query Sin Filtro de Nivel Inicial

Modificar la lógica para que cuando `selectedLevel` esté vacío, la query no filtre por nivel y muestre TODOS los peleadores de la organización (ordenados por puntos):

```tsx
// En useOrganizationRanking.tsx, línea 101-103
if (level) {
  query = query.eq('level', level);
}
// Cuando level es undefined/empty, no aplica filtro = muestra todos
```

### 3. Mostrar Indicador Mientras Carga el Nivel

Evitar el estado "vacío" mostrando skeleton mientras se determina el nivel correcto:

```tsx
// Condición mejorada para loading
const isInitializing = !selectedLevel && availableLevels.length > 0;
const showSkeleton = isLoading || isInitializing;
```

---

## Cambios Técnicos

### Archivo: `src/components/sections/Ranking.tsx`

1. **Líneas 49-59**: Modificar el useEffect para usar `levelCounts` y elegir nivel con datos disponibles
2. **Línea 233**: Ajustar condición de loading para incluir estado de inicialización
3. **Líneas 338-344**: Mejorar mensaje cuando no hay datos (ser más específico)

### Archivo: `src/hooks/useOrganizationRanking.tsx`

1. Ya retorna `levelCounts` - no requiere cambios
2. La query ya funciona sin filtro de nivel cuando `level` es undefined

---

## Flujo Mejorado

```text
ANTES:
1. selectedLevel = ''
2. Query ejecuta → puede retornar vacío
3. useEffect → selectedLevel = 'Profesional' (si no tiene datos, sigue vacío)
4. Query ejecuta → vacío

DESPUÉS:
1. selectedLevel = ''
2. Query ejecuta → retorna TODOS (sin filtro de nivel)
3. UI muestra skeleton mientras inicializa
4. useEffect + levelCounts → selectedLevel = nivel con datos
5. Query ejecuta → muestra ese nivel
```

---

## Mensaje de Estado Vacío Mejorado

Cuando genuinamente no hay peleadores (después de seleccionar nivel):

```tsx
<Card className="bg-black/40 border-purple-neon-primary/20">
  <CardContent className="p-6 text-center">
    <Users className="h-12 w-12 mx-auto mb-3 text-gray-500" />
    <p className="text-gray-400 mb-2">
      No hay peleadores registrados en {selectedLevel || 'esta categoría'}
    </p>
    <Button variant="outline" onClick={() => setSelectedLevel('')}>
      Ver todos los niveles
    </Button>
  </CardContent>
</Card>
```

---

## Verificación Post-Implementación

1. Ir a la página principal con UCC_MMA seleccionado → Debe mostrar lista de Pro
2. Cambiar a HHF_AMATEUR → Debe automáticamente mostrar Amateur (único nivel con datos)
3. Cambiar a BDG_PRO → Debe mostrar Pro (tiene 2 peleadores)
4. Nunca debe haber un estado donde el ranking esté vacío sin mensaje claro

