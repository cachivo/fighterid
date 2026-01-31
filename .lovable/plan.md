
# Plan: Auditoría de Contenido y Temática - Fighter ID

## Resumen Ejecutivo
Auditoría del contenido textual para asegurar que la plataforma se enfoque exclusivamente en **artes marciales y deportes de combate**. Se encontraron disciplinas no relacionadas y inconsistencias que deben corregirse.

---

## 1. Problemas Encontrados

### Disciplinas NO Relacionadas con Artes Marciales (ELIMINAR)

| Archivo | Disciplinas Incorrectas | Línea |
|---------|------------------------|-------|
| `src/pages/Predicciones.tsx` | "Rap Battle", "Chess", "Esports" | 181-184 |
| `src/pages/EventoBetting.tsx` | "rap", "chess", "esports" | 305-310 |

### Inconsistencias en Nombres de Disciplinas

| Variante Actual | Variante Correcta Propuesta |
|-----------------|---------------------------|
| "Boxing" (inglés) | "Boxeo" |
| "Jiu-Jitsu Brasileño" | "Jiu-Jitsu" o "BJJ" |
| "BOXING" (key en FighterBadges) | Debe mapear "Boxeo" |
| "BJJ" (key en FighterBadges) | Debe mapear "JiuJitsu" |
| "MUAY_THAI" (key) | Debe mapear "MuayThai" |

### Categorías de Peso en Inglés (NO Estandarizadas)

| Archivo | Estado |
|---------|--------|
| `src/pages/ProfileChangeRequest.tsx` | Inglés: Strawweight, Flyweight, etc. |
| `src/components/admin/ExternalFighterForm.tsx` | Inglés: Strawweight, Flyweight, etc. |

---

## 2. Lista Oficial de Disciplinas de Combate

Disciplinas válidas para la plataforma:

```text
┌─────────────────────────────────────────────────────────┐
│           DISCIPLINAS DE COMBATE PERMITIDAS             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STRIKING (Golpeo):                                     │
│  • Boxeo                                                │
│  • Kickboxing                                           │
│  • Muay Thai                                            │
│  • Karate                                               │
│  • Taekwondo                                            │
│                                                         │
│  GRAPPLING (Agarre/Suelo):                              │
│  • Jiu-Jitsu / BJJ                                      │
│  • Judo                                                 │
│  • Lucha Libre (Wrestling)                              │
│  • Sambo                                                │
│  • Grappling                                            │
│                                                         │
│  MIXTO:                                                 │
│  • MMA (Mixed Martial Arts)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Archivos a Modificar

### A. Eliminar Disciplinas No Relacionadas

**Archivo: `src/pages/Predicciones.tsx`**
- Líneas 179-185: Cambiar filtro de disciplinas
- Eliminar: "Rap Battle", "Chess", "Esports"
- Reemplazar con: "MMA", "Boxeo", "Kickboxing", "Muay Thai", "Jiu-Jitsu", "Judo"

**Archivo: `src/pages/EventoBetting.tsx`**
- Líneas 305-310: Eliminar casos para "rap", "chess", "esports"
- Actualizar iconos para disciplinas de combate

### B. Estandarizar Categorías de Peso

**Archivo: `src/pages/ProfileChangeRequest.tsx`**
- Líneas 17-20: Cambiar WEIGHT_CLASSES de inglés a español con libras
- Cambiar de: `['Strawweight', 'Flyweight', ...]`
- A: `[{ value: 'Peso Paja', label: 'Peso Paja (115 lbs)' }, ...]`

**Archivo: `src/components/admin/ExternalFighterForm.tsx`**
- Líneas 26-37: Cambiar WEIGHT_CLASSES de inglés a español con libras

### C. Estandarizar Lista de Disciplinas

Crear constante centralizada o actualizar en cada archivo:

**Archivos a actualizar:**
| Archivo | Cambio |
|---------|--------|
| `src/pages/ProfileChangeRequest.tsx` | Actualizar MARTIAL_ARTS y DISCIPLINES |
| `src/pages/admin/JudgesManagement.tsx` | Actualizar specializationOptions |
| `src/components/social/FighterBadges.tsx` | Agregar más disciplinas al mapping |

### D. Actualizar Badges de Disciplinas

**Archivo: `src/components/social/FighterBadges.tsx`**
- Agregar mappings para todas las disciplinas válidas
- Asegurar que "Boxeo" mapee correctamente (no solo "BOXING")

---

## 4. Constantes Estandarizadas Propuestas

### Disciplinas (para usar en todos los formularios)
```typescript
const MARTIAL_ARTS_DISCIPLINES = [
  'MMA',
  'Boxeo',
  'Kickboxing',
  'Muay Thai',
  'Jiu-Jitsu',
  'Judo',
  'Karate',
  'Taekwondo',
  'Lucha Libre',
  'Grappling',
  'Sambo'
] as const;
```

### Categorías de Peso (formato español + libras)
```typescript
const WEIGHT_CLASSES = [
  { value: 'Peso Paja', label: 'Peso Paja (115 lbs)' },
  { value: 'Peso Mosca', label: 'Peso Mosca (125 lbs)' },
  { value: 'Peso Gallo', label: 'Peso Gallo (135 lbs)' },
  { value: 'Peso Pluma', label: 'Peso Pluma (145 lbs)' },
  { value: 'Peso Ligero', label: 'Peso Ligero (155 lbs)' },
  { value: 'Peso Welter', label: 'Peso Welter (170 lbs)' },
  { value: 'Peso Medio', label: 'Peso Medio (185 lbs)' },
  { value: 'Peso Semipesado', label: 'Peso Semipesado (205 lbs)' },
  { value: 'Peso Pesado', label: 'Peso Pesado (265 lbs)' },
  { value: 'Peso Superpesado', label: 'Peso Superpesado (+265 lbs)' },
];
```

---

## 5. Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| `src/pages/Predicciones.tsx` | Eliminar disciplinas no-combate |
| `src/pages/EventoBetting.tsx` | Eliminar referencias rap/chess/esports |
| `src/pages/ProfileChangeRequest.tsx` | Estandarizar peso + disciplinas |
| `src/components/admin/ExternalFighterForm.tsx` | Estandarizar peso a español |
| `src/pages/admin/JudgesManagement.tsx` | Verificar especialidades |
| `src/components/social/FighterBadges.tsx` | Expandir mappings de disciplinas |

---

## 6. Verificación de Contenido Textual

### Textos del Hero (OK)
- "Plataforma profesional de gestión de peleadores"
- "Únete a la comunidad de peleadores profesionales"

### Textos de Registro (OK)
- Formularios enfocados en datos de peleadores de combate

### Areas a Mantener
- Sistema de scoring para peleas
- Gestión de gimnasios de artes marciales
- Licencias Fighter ID
- Records de peleas (W-L-D)

---

## 7. Impacto

- **Archivos a modificar**: 6
- **Disciplinas a eliminar**: 3 (Rap, Chess, Esports)
- **Constantes a estandarizar**: 2 (Weight Classes, Martial Arts)
- **Tiempo estimado**: ~15 minutos

Esta auditoría asegura que Fighter ID se mantenga enfocado exclusivamente en **artes marciales y deportes de combate**.
