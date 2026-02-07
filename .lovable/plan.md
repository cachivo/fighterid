
# Plan de Corrección: Errores de Edición y Optimización para Tablets

## Diagnóstico Confirmado

### Problema 1: Error al editar perfiles
**Causa raíz**: Conflicto de tipos ENUM en PostgreSQL

La base de datos tiene **dos tipos ENUM con nombres diferentes**:
- `discipline` - tipo usado por la columna `fighter_profiles.discipline`
- `discipline_type` - tipo diferente con los mismos valores

La función `admin_update_fighter_profile` usa `::discipline_type` para el cast:
```sql
discipline = CASE WHEN ... THEN NULLIF(p_profile_data->>'discipline', '')::discipline_type ...
```

Pero la columna espera `::discipline`. PostgreSQL no puede convertir automáticamente entre tipos ENUM diferentes.

### Problema 2: Tarjetas desalineadas en tablets
Las tarjetas de peleadores tienen diferentes alturas debido a:
- Nombres de diferente longitud causando wrap
- Falta de restricciones de ancho mínimo uniforme

### Problema 3: Modal de edición no optimizado para tablets
- Las 5 pestañas (`grid-cols-5`) son muy estrechas en pantallas de 768px
- El contenido interior necesita mejor adaptación responsive

---

## Soluciones Propuestas

### Fase 1: Corrección del Error de Base de Datos (SQL)

Actualizar la función `admin_update_fighter_profile` para usar el tipo correcto:

```sql
-- Cambiar ::discipline_type por ::discipline
discipline = CASE WHEN p_profile_data ? 'discipline' 
  THEN NULLIF(p_profile_data->>'discipline', '')::discipline 
  ELSE discipline END
```

### Fase 2: Optimización de Tarjetas (FightersProfiles.tsx)

**Cambios en el grid de tarjetas:**

| Aspecto | Antes | Después |
|---------|-------|---------|
| Contenedor nombre | `h-14` | `h-14 min-w-0 flex-1` |
| Título | `line-clamp-1` | `truncate` para mejor control |
| Grid | `gap-6` | `gap-4` para tablets compactos |

**Código propuesto para tarjetas uniformes:**
```tsx
<Card className="hover:shadow-md transition-shadow h-full flex flex-col">
  <CardHeader className="pb-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar fijo */}
        <div className="min-w-0 flex-1 h-14 flex flex-col justify-center">
          <CardTitle className="text-base font-semibold leading-tight truncate">
            {fighter.first_name} {fighter.last_name}
          </CardTitle>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {fighter.nickname ? `"${fighter.nickname}"` : '\u00A0'}
          </p>
        </div>
      </div>
      {/* Botones fijos a la derecha */}
    </div>
  </CardHeader>
  <CardContent className="pt-0 flex-1">
    {/* Contenido */}
  </CardContent>
</Card>
```

### Fase 3: Optimización del Modal para Tablets (FighterEditModal.tsx)

**Cambios propuestos:**

1. **Tabs responsivas**:
```tsx
// Antes
<TabsList className="grid w-full grid-cols-5">

// Después - Scroll horizontal en tablets pequeñas
<TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5">
```

2. **Contenido del modal más compacto**:
```tsx
// Antes
<DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">

// Después - Mejor adaptación a tablets
<DialogContent className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
```

3. **Grids interiores responsivos**:
```tsx
// Antes
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Después - Gap reducido en tablets
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `admin_update_fighter_profile` (SQL) | Cambiar `::discipline_type` por `::discipline` |
| `src/pages/admin/FightersProfiles.tsx` | Optimizar grid de tarjetas |
| `src/components/admin/FighterEditModal.tsx` | Tabs y contenido responsive |

---

## Secuencia de Implementación

1. **Migración SQL** - Corregir la función RPC (soluciona el error inmediatamente)
2. **FightersProfiles.tsx** - Uniformizar tarjetas con truncate y altura fija
3. **FighterEditModal.tsx** - Hacer tabs y contenido responsive para tablets

---

## Resultado Esperado

- Los perfiles se editarán correctamente sin errores de tipo
- Las tarjetas de peleadores tendrán altura uniforme independientemente del nombre
- El modal de edición será usable en tablets (768px+)
- Las pestañas serán legibles y accesibles en pantallas medianas
