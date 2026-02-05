
# Plan: Sincronización de Perfiles de Peleadores y Sistema de Rankings Multi-Liga

## Resumen del Problema

Actualmente existe una **desconexión arquitectónica** entre la gestión de perfiles de peleadores y el sistema de rankings:

| Componente | Estado Actual | Problema |
|------------|---------------|----------|
| `fighter_profiles` | Tiene `discipline`, `level` | Campos informativos que no conectan con rankings |
| `fighter_rankings` | Tabla separada con membresías | No se crea automáticamente al crear perfil |
| Admin UI | Crea perfiles | No inscribe al peleador en ningún ranking |
| Rankings Management | Solo ajusta puntos | No puede agregar peleadores nuevos |

**Dato importante**: Los 57 peleadores activos en BD ya tienen rankings, probablemente migrados manualmente. Pero el flujo de creación nuevo NO automatiza esto.

---

## Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIGHTER_PROFILES                                   │
│  (Datos del peleador: nombre, país, avatar, artes de entrenamiento, etc.)    │
│  - discipline: informativo (disciplina principal de preferencia)             │
│  - level: informativo (nivel principal actual)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1:N
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIGHTER_RANKINGS                                   │
│  (Membresías en ligas - UN PELEADOR puede tener MÚLTIPLES registros)         │
│                                                                              │
│  Ejemplo: Randy Tercero puede tener:                                         │
│  ├── UCC MMA → Amateur → Peso Ligero → 45 pts                                │
│  ├── UCC MMA → Semi-profesional → Peso Ligero → 12 pts                       │
│  └── BDG Pro → Profesional → Peso Welter → 8 pts                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cambios Requeridos

### Parte 1: Modificar Formulario de Creación de Perfiles

**Archivo:** `src/components/admin/AdminFighterForm.tsx`

**Cambios:**
1. Agregar sección "Liga Inicial de Competencia" con:
   - Select de Organización (UCC MMA, BDG Pro, HHF Amateur)
   - Select de Nivel (filtrado según organización)
   - Categoría de peso ya existe

2. Modificar `handleSubmit` para:
   - Crear `fighter_profile`
   - Crear registro en `fighter_rankings` con la liga seleccionada

**Estructura UI propuesta:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  INSCRIPCIÓN A LIGA DE COMPETENCIA *                                │
├─────────────────────────────────────────────────────────────────────┤
│  Este peleador competirá inicialmente en:                           │
│                                                                     │
│  Liga/Organización *          Nivel *                               │
│  ┌─────────────────────┐     ┌─────────────────────┐               │
│  │ UCC MMA           ▼│     │ Amateur           ▼│               │
│  └─────────────────────┘     └─────────────────────┘               │
│                                                                     │
│  ⓘ Un administrador puede agregar ligas adicionales después        │
└─────────────────────────────────────────────────────────────────────┘
```

### Parte 2: Crear Hook para Gestión de Rankings

**Nuevo archivo:** `src/hooks/useFighterRankingMembership.tsx`

**Funcionalidades:**
- `addFighterToRanking(fighterId, organizationId, level, weightClass)`
- `removeFighterFromRanking(rankingId)`
- `updateFighterRankingLevel(rankingId, newLevel)`

### Parte 3: Agregar UI en Admin para Gestionar Membresías

**Archivo:** `src/components/admin/FighterDetailModal.tsx`

**Nuevo tab:** "Ligas y Rankings"

Mostrar:
- Lista de ligas donde compite el peleador (con useFighterActiveLeagues)
- Botón "Agregar a nueva liga" (solo admin)
- Opción de remover de una liga (solo admin)

**Estructura UI propuesta:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  LIGAS DE COMPETENCIA                                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 🥊 UCC MMA                                                    │ │
│  │    Amateur • Peso Ligero • 45 pts • #3                        │ │
│  │    [Cambiar Nivel] [Remover]                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 🥊 BDG Pro Boxing                                             │ │
│  │    Profesional • Peso Welter • 8 pts • #12                    │ │
│  │    [Cambiar Nivel] [Remover]                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [+ Agregar a Nueva Liga]                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Parte 4: Agregar Peleadores desde Rankings Management

**Archivo:** `src/pages/admin/RankingsManagement.tsx`

**Nuevo componente:** "Agregar Peleador al Ranking"

- Modal para buscar peleador existente
- Seleccionar nivel y categoría (según organización actual)
- Crear registro en fighter_rankings

### Parte 5: Base de Datos (opcional pero recomendado)

**Función RPC sugerida:** `enroll_fighter_in_ranking`

```sql
CREATE OR REPLACE FUNCTION enroll_fighter_in_ranking(
  p_fighter_id UUID,
  p_organization_code TEXT,
  p_level TEXT,
  p_weight_class TEXT
) RETURNS UUID
```

Esta función:
- Valida que el nivel sea permitido para la organización
- Verifica que no exista duplicado (mismo peleador+org+nivel+categoría)
- Crea el registro con puntos iniciales = 0

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/components/admin/AdminFighterForm.tsx` | Agregar selección de liga inicial | Alta |
| `src/hooks/useFighterRankingMembership.tsx` | Nuevo hook para gestión | Alta |
| `src/components/admin/FighterDetailModal.tsx` | Tab de ligas con gestión | Alta |
| `src/pages/admin/RankingsManagement.tsx` | Botón agregar peleador | Media |
| `src/hooks/useRankingOrganizations.tsx` | Posible extensión | Baja |

---

## Flujo de Usuario Propuesto

### Escenario 1: Crear nuevo peleador

```text
1. Admin va a "Crear Perfil"
2. Llena datos básicos (nombre, país, categoría de peso)
3. Selecciona liga inicial: "UCC MMA - Amateur"
4. Guarda
5. Sistema crea:
   - fighter_profiles (perfil básico)
   - fighter_rankings (inscripción en UCC MMA Amateur con 0 pts)
```

### Escenario 2: Promover peleador a otra liga/nivel

```text
1. Admin abre detalle de peleador existente
2. Va a tab "Ligas y Rankings"
3. Ve: "UCC MMA - Amateur - 45 pts"
4. Clic en "Agregar a Nueva Liga"
5. Selecciona: "BDG Pro Boxing - Profesional"
6. Confirma
7. Sistema crea nuevo registro en fighter_rankings
8. Peleador ahora aparece en ambos rankings con puntos independientes
```

### Escenario 3: Agregar desde Rankings Management

```text
1. Admin va a "Gestión de Rankings"
2. Selecciona "HHF Amateur"
3. Clic en "Agregar Peleador"
4. Busca: "José Mejía"
5. Selecciona nivel "Amateur" y categoría "Peso Mosca"
6. Confirma
7. José ahora aparece en el ranking HHF Amateur con 0 pts
```

---

## Reglas de Negocio

1. **Un peleador puede estar en MÚLTIPLES ligas** (UCC + BDG + HHF)
2. **Un peleador puede estar en MÚLTIPLES niveles** dentro de la misma liga (Amateur + Semi)
3. **Los records por disciplina son GLOBALES** (mma_record_* aplica a todas las ligas MMA)
4. **Los puntos son POR INSCRIPCIÓN** (independientes en cada liga/nivel)
5. **Solo admin puede agregar/remover membresías de liga**
6. **Al crear perfil, se DEBE seleccionar una liga inicial**

---

## Sección Técnica

### Validaciones de la función RPC

```sql
-- Validar que el nivel esté permitido
IF p_level NOT IN (SELECT unnest(allowed_levels) FROM ranking_organizations WHERE code = p_organization_code) THEN
  RAISE EXCEPTION 'Nivel % no permitido para organización %', p_level, p_organization_code;
END IF;

-- Evitar duplicados exactos
IF EXISTS (SELECT 1 FROM fighter_rankings 
           WHERE fighter_id = p_fighter_id 
           AND organization_id = (SELECT id FROM ranking_organizations WHERE code = p_organization_code)
           AND level = p_level 
           AND weight_class = p_weight_class) THEN
  RAISE EXCEPTION 'El peleador ya está inscrito en esta liga/nivel/categoría';
END IF;
```

### Relación con campos del perfil

Los campos `discipline` y `level` en `fighter_profiles` se mantienen como **preferencias informativas**. El sistema real de rankings se basa 100% en `fighter_rankings`.

**Opción futura**: Sincronizar automáticamente `fighter_profiles.discipline` y `level` con la primera/principal inscripción de ranking.
