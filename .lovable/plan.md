

# Plan: Estandarizar Opciones de "Stance" en Español

## Problema Identificado

Las opciones de stance están inconsistentes entre diferentes archivos:

```text
┌────────────────────────────────────────────────────────────────────┐
│                    INCONSISTENCIAS ACTUALES                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  LicenseOnboarding.tsx:                                            │
│    ✓ Ortodoxo, Zurdo, Switch (valores y labels en español)         │
│                                                                    │
│  ProfileChangeRequest.tsx:                                         │
│    ⚠️ Orthodox → "Ortodoxa", Southpaw → "Zurda" (mezcla)           │
│                                                                    │
│  UserFighterProfileEditForm.tsx:                                   │
│    ✗ Orthodox, Southpaw, Switch (todo en inglés)                   │
│                                                                    │
│  AdminFighterForm.tsx / FighterEditModal.tsx:                      │
│    ✗ Orthodox, Southpaw, Switch (todo en inglés)                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Solución Propuesta

### 1. Crear Constante Centralizada

Agregar en `src/lib/constants/disciplines.ts`:

```typescript
export const STANCES = [
  { value: 'Ortodoxo', label: 'Ortodoxo' },
  { value: 'Zurdo', label: 'Zurdo' },
  { value: 'Switch', label: 'Switch' },
] as const;
```

### 2. Actualizar Todos los Formularios

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminFighterForm.tsx` | Importar STANCES de constants, eliminar constante local |
| `src/components/admin/FighterEditModal.tsx` | Importar STANCES de constants, eliminar constante local |
| `src/components/UserFighterProfileEditForm.tsx` | Cambiar opciones a español |
| `src/pages/ProfileChangeRequest.tsx` | Cambiar valores a español ("Ortodoxo", "Zurdo") |

### 3. Migración de Datos Existentes

Actualizar registros en la base de datos:

```sql
UPDATE fighter_profiles SET stance = 'Ortodoxo' WHERE stance = 'Orthodox';
UPDATE fighter_profiles SET stance = 'Zurdo' WHERE stance = 'Southpaw';
-- 'Switch' permanece igual
```

---

## Archivos a Modificar

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/lib/constants/disciplines.ts` | Final | Agregar STANCES constant |
| `src/components/admin/AdminFighterForm.tsx` | 25-29 | Eliminar STANCES local, importar |
| `src/components/admin/FighterEditModal.tsx` | 44-49 | Eliminar STANCES local, importar |
| `src/components/UserFighterProfileEditForm.tsx` | 650-654 | Cambiar opciones a español |
| `src/pages/ProfileChangeRequest.tsx` | 467-470 | Cambiar valores a español |
| Migración SQL | Nueva | Actualizar datos existentes |

---

## Resultado Final

Todas las opciones de stance mostrarán consistentemente:

- **Ortodoxo** - Guardia derecha adelante (mayoría de peleadores)
- **Zurdo** - Guardia izquierda adelante (southpaw)
- **Switch** - Cambia entre ambas guardias

