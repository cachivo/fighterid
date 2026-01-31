
# Plan: Sistema de Clasificación de Fighter ID por Disciplina

## Resumen
Implementar un sistema donde los peleadores pueden inscribirse en disciplinas específicas, limitando inicialmente las opciones a **MMA** y **Boxeo Profesional**.

---

## 1. Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE DISCIPLINAS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   DISCIPLINAS HABILITADAS (visible en formularios):                  │
│   ┌─────────────┐    ┌────────────────────┐                         │
│   │    MMA      │    │  Boxeo Profesional │                         │
│   └─────────────┘    └────────────────────┘                         │
│                                                                      │
│   DISCIPLINAS EN DB (para compatibilidad futura):                    │
│   MMA, Boxeo, Judo, JiuJitsu, Kickboxing, MuayThai, Grappling, Otro │
│                                                                      │
│   FLUJO:                                                             │
│   Peleador → Selecciona disciplina(s) → Se guarda en fighter_profiles│
│                         ↓                                            │
│              Licencia Fighter ID → Por cada disciplina seleccionada  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cambios a Implementar

### A. Crear Archivo Centralizado de Constantes

**Nuevo archivo: `src/lib/constants/disciplines.ts`**

```typescript
// Disciplinas actualmente habilitadas en la plataforma
export const ENABLED_DISCIPLINES = [
  { 
    value: 'MMA', 
    label: 'MMA (Artes Marciales Mixtas)',
    description: 'Combate que combina técnicas de striking y grappling'
  },
  { 
    value: 'Boxeo', 
    label: 'Boxeo Profesional',
    description: 'Arte del pugilismo - solo golpes con los puños'
  },
] as const;

// Todas las disciplinas válidas en el sistema (para compatibilidad de DB)
export const ALL_DISCIPLINES = [
  'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
] as const;

export type EnabledDiscipline = typeof ENABLED_DISCIPLINES[number]['value'];
export type AllDiscipline = typeof ALL_DISCIPLINES[number];
```

---

### B. Actualizar Formulario de Onboarding de Licencia

**Archivo: `src/pages/license/LicenseOnboarding.tsx`**

Cambios:
- Importar `ENABLED_DISCIPLINES` desde el archivo centralizado
- Reemplazar los checkboxes de "martialArts" por un selector de disciplina principal
- Agregar UI clara para seleccionar en qué disciplinas quiere competir

**Antes:**
```typescript
const martialArts = [
  'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
];
```

**Después:**
```typescript
import { ENABLED_DISCIPLINES } from '@/lib/constants/disciplines';

// Selector de disciplina(s) donde quiere competir
<div className="space-y-4">
  <Label>¿En qué disciplina(s) deseas competir? *</Label>
  <p className="text-sm text-muted-foreground">
    Selecciona las disciplinas para las cuales deseas obtener tu Fighter ID
  </p>
  {ENABLED_DISCIPLINES.map((discipline) => (
    <Card key={discipline.value} className="cursor-pointer ...">
      <Checkbox checked={...} />
      <div>
        <h4>{discipline.label}</h4>
        <p>{discipline.description}</p>
      </div>
    </Card>
  ))}
</div>
```

---

### C. Actualizar Formulario Admin de Peleadores

**Archivo: `src/components/admin/AdminFighterForm.tsx`**

Cambios:
- Importar `ENABLED_DISCIPLINES`
- Actualizar el selector de disciplina
- Mostrar solo MMA y Boxeo como opciones

---

### D. Actualizar FighterProfileForm

**Archivo: `src/components/FighterProfileForm.tsx`**

Cambios:
- Importar `ENABLED_DISCIPLINES`
- Actualizar la lista de artes marciales a solo las habilitadas
- Mejorar UI para clarificar que es selección de disciplina de competencia

---

### E. Actualizar ExternalFighterForm

**Archivo: `src/components/admin/ExternalFighterForm.tsx`**

Cambios similares para mantener consistencia.

---

## 3. Flujo de Usuario Actualizado

```text
┌─────────────────────────────────────────────────────────────────────┐
│              REGISTRO DE FIGHTER ID - NUEVO FLUJO                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Paso 1: Datos Personales                                           │
│  ├── Nombre, Apellido, País                                         │
│  └── Fecha de nacimiento, Género                                    │
│                                                                      │
│  Paso 2: Información de Combate                                     │
│  ├── Altura, Peso, Alcance                                          │
│  └── Categoría de peso, Nivel (Amateur/Pro)                         │
│                                                                      │
│  Paso 3: DISCIPLINA(S) DE COMPETENCIA  ← NUEVO                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ¿En qué disciplina(s) deseas competir?                      │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ ☑ MMA (Artes Marciales Mixtas)                        │   │   │
│  │  │   Combate que combina técnicas de striking y grappling│   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ ☐ Boxeo Profesional                                   │   │   │
│  │  │   Arte del pugilismo - solo golpes con los puños      │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Paso 4: Récord y Documentos                                        │
│  └── Foto, Documento de identidad                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/lib/constants/disciplines.ts` | **CREAR** - Constantes centralizadas |
| `src/pages/license/LicenseOnboarding.tsx` | Actualizar selector de disciplinas |
| `src/components/admin/AdminFighterForm.tsx` | Actualizar a usar disciplinas habilitadas |
| `src/components/FighterProfileForm.tsx` | Actualizar a usar disciplinas habilitadas |
| `src/components/admin/ExternalFighterForm.tsx` | Actualizar a usar disciplinas habilitadas |
| `src/hooks/useOptimizedOnboarding.ts` | Asegurar compatibilidad con selección |

---

## 5. Compatibilidad con Base de Datos

El enum `discipline` en la base de datos ya incluye:
- MMA ✓
- Boxeo ✓
- Judo (deshabilitado por ahora)
- JiuJitsu (deshabilitado por ahora)
- Kickboxing (deshabilitado por ahora)
- MuayThai (deshabilitado por ahora)
- Grappling (deshabilitado por ahora)
- Otro (deshabilitado por ahora)

**No se requieren migraciones de base de datos.** Solo limitamos qué opciones se muestran en la UI.

---

## 6. Escalabilidad Futura

Para habilitar nuevas disciplinas en el futuro, solo se necesita:

```typescript
// En src/lib/constants/disciplines.ts
export const ENABLED_DISCIPLINES = [
  { value: 'MMA', label: 'MMA (Artes Marciales Mixtas)', ... },
  { value: 'Boxeo', label: 'Boxeo Profesional', ... },
  // Agregar nuevas disciplinas aquí:
  { value: 'Kickboxing', label: 'Kickboxing', ... },
  { value: 'MuayThai', label: 'Muay Thai', ... },
];
```

---

## 7. Resumen de Impacto

- **Archivos nuevos**: 1
- **Archivos modificados**: 5
- **Migraciones DB**: Ninguna
- **Disciplinas habilitadas**: MMA, Boxeo
- **Tiempo estimado**: ~20 minutos
