
# Plan: Auditoria y Correccion del Panel de Administracion de Peleadores

## Resumen de Problemas Encontrados

He detectado **inconsistencias criticas** entre los componentes del admin panel que no coinciden con nuestro diseño actualizado de separacion de disciplinas.

---

## Problema 1: AdminFighterForm.tsx Desactualizado

**Archivo:** `src/components/admin/AdminFighterForm.tsx`

El formulario de creacion/invitacion de peleadores **NO** sigue el diseño que implementamos en `FighterEditModal.tsx`.

| Aspecto | FighterEditModal (CORRECTO) | AdminFighterForm (INCORRECTO) |
|---------|----------------------------|------------------------------|
| Disciplina | Select unico (`discipline`) | Checkbox multiple (`martial_arts`) |
| Artes de entrenamiento | Checkboxes con `MARTIAL_ARTS_TRAINING` | Mezcla con disciplinas de competencia |
| Logica de records | Usa `formData.discipline === 'MMA'` | Usa `formData.martial_arts?.includes('MMA')` |

**Ubicaciones especificas:**
- Linea 395-432: Muestra "Disciplina(s) de Competencia" pero permite seleccion multiple guardando en `martial_arts`
- Linea 102-118: `handleMartialArtsChange` mezcla conceptos
- Linea 527: Condicion incorrecta `formData.martial_arts?.includes('MMA')`
- Linea 568: Condicion incorrecta `formData.martial_arts?.includes('Boxeo')`

**Correccion requerida:** Alinear con la estructura de `FighterEditModal.tsx`

---

## Problema 2: Listado de Peleadores Muestra Record Legacy

**Archivo:** `src/pages/admin/FightersProfiles.tsx` (Linea 276-280)

```typescript
// ACTUAL - Muestra record legacy (incorrecto)
<Badge variant="secondary">
  {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
</Badge>

// DEBERIA - Mostrar segun disciplina
{fighter.discipline === 'MMA' && (
  <Badge variant="secondary">
    {fighter.mma_record_wins}-{fighter.mma_record_losses}-{fighter.mma_record_draws}
  </Badge>
)}
```

**Impacto:** El admin ve records que no corresponden con la disciplina real del peleador.

---

## Problema 3: Interface de useAdminFighters Incompleta

**Archivo:** `src/hooks/useAdminFighters.tsx`

La interface `AdminFighterProfile` no incluye los campos de record por disciplina:

```typescript
// ACTUAL (lineas 5-28)
export interface AdminFighterProfile {
  record_wins: number;     // Solo legacy
  record_losses: number;
  record_draws: number;
  // FALTAN: mma_record_*, boxeo_record_*
}
```

**Correccion:**
```typescript
export interface AdminFighterProfile {
  // Legacy (deprecated)
  record_wins: number;
  record_losses: number;
  record_draws: number;
  // Records por disciplina
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
  martial_arts?: string[];  // FALTA
}
```

---

## Problema 4: FighterDetailModal Muestra Record Legacy

**Archivo:** `src/components/admin/FighterDetailModal.tsx` (Linea 136)

```typescript
// ACTUAL
<Badge variant="outline" className="text-sm">
  Record: {data.profile?.record_wins || 0}-{data.profile?.record_losses || 0}-{data.profile?.record_draws || 0}
</Badge>

// DEBERIA mostrar segun discipline
```

---

## Comparativa Visual de Componentes

```text
COMPONENTE                    | DISCIPLINA | ARTES ENTRENAMIENTO | RECORDS
------------------------------|------------|---------------------|----------
FighterEditModal.tsx          | Correcto   | Correcto            | Correcto
AdminFighterForm.tsx          | INCORRECTO | INCORRECTO          | INCORRECTO
FightersProfiles.tsx          | OK         | N/A                 | INCORRECTO
FighterDetailModal.tsx        | OK         | OK                  | INCORRECTO
useAdminFighters.tsx          | Parcial    | FALTA               | FALTAN campos
```

---

## Plan de Correccion

### Archivo 1: `src/components/admin/AdminFighterForm.tsx`

**Cambios:**

1. Reemplazar la seccion de "Disciplina(s) de Competencia" por dos secciones separadas:
   - Card 1: **Disciplina de Competencia** (Select unico con `ENABLED_DISCIPLINES`)
   - Card 2: **Artes Marciales de Entrenamiento** (Checkboxes con `MARTIAL_ARTS_TRAINING`)

2. Agregar import de `MARTIAL_ARTS_TRAINING`

3. Crear funcion `handleDisciplineChange` similar a FighterEditModal

4. Modificar funcion `handleMartialArtsChange` para solo manejar artes de entrenamiento

5. Cambiar condiciones de records:
   - De: `formData.martial_arts?.includes('MMA')`
   - A: `formData.discipline === 'MMA'`

### Archivo 2: `src/pages/admin/FightersProfiles.tsx`

**Cambios:**

1. Modificar display de record (linea 276-280) para mostrar segun disciplina:
```typescript
// Funcion helper para obtener el record correcto
const getRecordDisplay = (fighter: AdminFighterProfile) => {
  if (fighter.discipline === 'MMA') {
    return `${fighter.mma_record_wins || 0}-${fighter.mma_record_losses || 0}-${fighter.mma_record_draws || 0}`;
  } else if (fighter.discipline === 'Boxeo') {
    return `${fighter.boxeo_record_wins || 0}-${fighter.boxeo_record_losses || 0}-${fighter.boxeo_record_draws || 0}`;
  }
  // Fallback a legacy
  return `${fighter.record_wins}-${fighter.record_losses}-${fighter.record_draws}`;
};
```

### Archivo 3: `src/hooks/useAdminFighters.tsx`

**Cambios:**

1. Expandir interface `AdminFighterProfile` con campos faltantes:
```typescript
// Agregar campos de records por disciplina
mma_record_wins?: number;
mma_record_losses?: number;
mma_record_draws?: number;
boxeo_record_wins?: number;
boxeo_record_losses?: number;
boxeo_record_draws?: number;
martial_arts?: string[];
```

2. Expandir interface `AdminFighterFormData` con los mismos campos

### Archivo 4: `src/components/admin/FighterDetailModal.tsx`

**Cambios:**

1. Modificar display de record en header (linea 136) para mostrar segun disciplina

2. Agregar seccion de "Artes Marciales de Entrenamiento" separada de "Disciplina de Competencia" en tab deportivo

---

## Archivos a Modificar

| Archivo | Prioridad | Complejidad |
|---------|-----------|-------------|
| `src/components/admin/AdminFighterForm.tsx` | Alta | Media |
| `src/pages/admin/FightersProfiles.tsx` | Alta | Baja |
| `src/hooks/useAdminFighters.tsx` | Alta | Baja |
| `src/components/admin/FighterDetailModal.tsx` | Media | Baja |

---

## Beneficios de las Correcciones

1. **Coherencia total** entre edicion y creacion de peleadores
2. **Records correctos** mostrados segun disciplina de competencia
3. **Separacion clara** entre disciplinas de ranking y artes de entrenamiento
4. **TypeScript correcto** con interfaces completas
5. **Mejor UX** para administradores

---

## Seccion Tecnica

### Estructura de Datos Correcta

```typescript
// CAMPO discipline → Define ranking (MMA o Boxeo)
// CAMPO martial_arts[] → Artes de entrenamiento (informativo)
// CAMPOS mma_record_* → Solo si discipline === 'MMA'
// CAMPOS boxeo_record_* → Solo si discipline === 'Boxeo'
```

### Flujo de Validacion Propuesto

```text
1. Usuario selecciona Disciplina de Competencia (obligatorio)
2. Sistema habilita campos de record correspondientes
3. Usuario puede agregar artes de entrenamiento (opcional)
4. Al guardar: discipline y martial_arts se guardan por separado
```
