

# Plan: Corregir Selección Automática de Nivel al Cambiar Organización

## Problema Identificado

Al cambiar de UCC_MMA a HHF_AMATEUR:
1. `selectedLevel` mantiene el valor anterior ("Profesional")
2. La condición `!selectedLevel` es falsa, así que el `useEffect` no selecciona automáticamente "Amateur"
3. HHF no tiene peleadores en "Profesional", por lo que la lista queda vacía
4. El usuario debe hacer click manualmente en "Amateur" para ver los datos

## Solución

Resetear `selectedLevel` a vacío (`''`) cuando cambia la organización. Esto permitirá que el `useEffect` de selección inteligente se ejecute y elija el nivel correcto para HHF (que es "Amateur").

---

## Cambio Técnico

### Archivo: `src/components/sections/Ranking.tsx`

**Líneas 72-76** - Agregar reset de `selectedLevel`:

```tsx
// Reset page and filters when org changes
useEffect(() => {
  setPage(1);
  setSelectedLevel('');  // ← AGREGAR ESTA LÍNEA
  setSelectedWeightClass('');
  setSelectedGender('');
}, [organizationCode]);
```

---

## Flujo Corregido

```text
ANTES (bug):
1. Usuario en UCC_MMA → selectedLevel = "Profesional"
2. Cambia a HHF_AMATEUR
3. selectedLevel sigue = "Profesional" (no hay reset)
4. HHF no tiene "Profesional" → lista vacía
5. Usuario debe clickear "Amateur" manualmente

DESPUÉS (corregido):
1. Usuario en UCC_MMA → selectedLevel = "Profesional"  
2. Cambia a HHF_AMATEUR
3. selectedLevel = "" (reset automático)
4. useEffect detecta !selectedLevel && availableLevels.length > 0
5. levelCounts muestra Amateur=6, Pro=0, Semi=0
6. selectedLevel = "Amateur" (automático)
7. Lista muestra 6 peleadores inmediatamente
```

---

## Verificación

1. Ir a la página principal con UCC_MMA → Ver ranking de "Profesional"
2. Cambiar a HHF_AMATEUR usando el selector de liga
3. El nivel "Amateur" debe seleccionarse automáticamente y mostrar los peleadores
4. Cambiar a BDG_PRO → Debe mostrar "Profesional" automáticamente

