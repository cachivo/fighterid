

# Plan: Completar Sistema de Entrenadores para Peleadores

## Resumen del Analisis

He revisado el sistema actual de entrenadores y encontre que:

| Componente | Estado | Detalle |
|------------|--------|---------|
| CRUD Admin de coaches | Funciona | Crear, editar, eliminar entrenadores |
| Subir avatar de coach | FALTA | No hay campo de foto en formularios |
| Selector coach en perfil de peleador | FALTA | La tabla `fighter_profiles` tiene `coach_id` pero no se usa en UI |
| Mostrar coach en perfil publico | FALTA | La pagina del peleador no muestra su entrenador |

## Cambios Propuestos

### 1. Agregar Avatar a Formularios de Coach

**Archivos a modificar:**
- `src/pages/admin/EntrenadoresAdmin.tsx` - Agregar FileUpload al dialog de crear
- `src/components/admin/CoachEditModal.tsx` - Agregar FileUpload al modal de editar

Incluir:
- Campo de subida de imagen con preview
- Subida a Supabase Storage bucket `coaches`
- Mostrar avatar actual al editar

### 2. Agregar Selector de Entrenador en Perfil de Peleador

**Archivos a modificar:**
- `src/hooks/useFighterProfiles.tsx` - Agregar `coach_id` al tipo de datos
- `src/components/FighterProfileForm.tsx` - Agregar Select de entrenadores (al crear perfil)
- `src/components/UserFighterProfileEditForm.tsx` - Agregar Select de entrenadores (al editar)

Logica:
- Dropdown que carga coaches del hook `useCoaches`
- Filtrar coaches por `gym_id` si el peleador tiene gimnasio seleccionado
- Campo opcional (un peleador puede no tener entrenador asignado)

### 3. Mostrar Entrenador en Perfil Publico del Peleador

**Archivo a modificar:** `src/pages/FighterProfile.tsx`

Agregar seccion que muestre:
- Avatar del entrenador
- Nombre completo
- Especialidades
- Link al perfil del entrenador (si existe pagina publica)

### 4. Crear Hook para Obtener Coach con Fighter

**Modificar:** `src/hooks/useFighterProfiles.tsx`

Actualizar query para incluir relacion con coach:
```typescript
.select(`
  *,
  coach:coaches(id, nombre, apellidos, avatar_url, especialidades, gym_id)
`)
```

## Diagrama de Flujo Propuesto

```text
Admin crea Entrenador
       │
       ▼
┌────────────────────┐
│ EntrenadoresAdmin  │
│ + Avatar Upload    │
└─────────┬──────────┘
          │
          ▼
   Base de datos
   (tabla coaches)
          │
          ▼
┌────────────────────────────┐
│ Peleador edita su perfil   │
│                            │
│ Selecciona:                │
│  - Gimnasio (opcional)     │
│  - Entrenador (opcional)   │
└─────────┬──────────────────┘
          │
          ▼
   fighter_profiles.coach_id
          │
          ▼
┌────────────────────────────┐
│ Perfil publico muestra:    │
│                            │
│ "Entrenado por:"           │
│ [Avatar] Juan Perez        │
│ Especialidades: MMA, BJJ   │
└────────────────────────────┘
```

## Seccion Tecnica

### Storage Bucket para Coaches
- Verificar/crear bucket `coaches` en Supabase Storage
- Politicas RLS: admins pueden subir, publico puede leer

### Tipos TypeScript a Actualizar

```typescript
// En useFighterProfiles.tsx
export interface FighterProfile {
  // ... campos existentes
  coach_id?: string;
  coach?: {
    id: string;
    nombre: string;
    apellidos?: string;
    avatar_url?: string;
    especialidades?: string[];
  };
}

export interface FighterProfileData {
  // ... campos existentes
  coach_id?: string | null;
}
```

### Componente de Avatar Upload para Coaches

Reutilizar el componente `FileUpload` existente:
```typescript
<FileUpload
  onFileSelect={(file) => handleAvatarUpload(file)}
  accept="image/*"
  maxSize={3}
  preview={formData.avatar_url}
  autoResize={true}
  resizeOptions={{ 
    maxWidth: 300, 
    maxHeight: 300, 
    quality: 0.85 
  }}
/>
```

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/pages/admin/EntrenadoresAdmin.tsx` | Agregar avatar upload al crear |
| `src/components/admin/CoachEditModal.tsx` | Agregar avatar upload al editar |
| `src/components/FighterProfileForm.tsx` | Agregar selector de coach |
| `src/components/UserFighterProfileEditForm.tsx` | Agregar selector de coach |
| `src/hooks/useFighterProfiles.tsx` | Agregar coach_id y relacion |
| `src/pages/FighterProfile.tsx` | Mostrar info del entrenador |
| Migracion SQL | Crear bucket storage `coaches` |

## Resultado Esperado

1. Admin puede crear/editar entrenadores con foto de perfil
2. Peleadores pueden seleccionar su entrenador al editar perfil
3. Perfil publico del peleador muestra nombre y foto del entrenador
4. Si el peleador selecciona un gimnasio, se filtran los entrenadores de ese gimnasio

