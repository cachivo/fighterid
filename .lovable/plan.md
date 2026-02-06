
# Plan de Coherencia de Datos - Formularios de Usuario y Administracion

## Problema Identificado (Imagen del Usuario)

La imagen muestra claramente "Strawweight" en el formulario de edicion del usuario en lugar de "Peso Paja (115 lbs)" como deberia aparecer. Esto causa:

1. **Inconsistencia visual**: Usuario ve valores en ingles mientras el resto de la plataforma usa espanol
2. **Datos corruptos en BD**: Se guardan valores mixtos (ingles/espanol)
3. **Rankings desincronizados**: Los rankings esperan valores en espanol

---

## Archivos con Problemas Criticos

### 1. UserFighterProfileEditForm.tsx (FORMULARIO DE USUARIO)

**Problema A - Categorias de Peso (lineas 744-753):**
```tsx
// ACTUAL (INCORRECTO - en ingles)
<SelectItem value="Strawweight">Strawweight</SelectItem>
<SelectItem value="Flyweight">Flyweight</SelectItem>
<SelectItem value="Bantamweight">Bantamweight</SelectItem>
...
```

**Problema B - Niveles (lineas 776-778):**
```tsx
// ACTUAL (INCORRECTO - mayusculas y formato incorrecto)
<SelectItem value="AMATEUR">Amateur</SelectItem>
<SelectItem value="SEMI_PRO">Semi-Profesional</SelectItem>
<SelectItem value="PROFESSIONAL">Profesional</SelectItem>
```

**Problema C - Pais (linea 557):**
```tsx
// ACTUAL (INCORRECTO - Input libre)
<Input {...field} placeholder="HN" />
```

---

### 2. FightersProfilesInvite.tsx (ADMIN - INVITACIONES)

**Problema - Constante local en ingles (lineas 12-23):**
```tsx
// ACTUAL (INCORRECTO)
const WEIGHT_CLASSES = [
  'Strawweight', 'Flyweight', 'Bantamweight'...
];
```

**Problema - Valor por defecto (lineas 36, 73):**
```tsx
weightClass: 'Lightweight',  // INCORRECTO
```

---

### 3. EventosPelea.tsx (ADMIN - EVENTOS)

**Problema - Valores en ingles pero labels en espanol (lineas 1259-1266):**
```tsx
// ACTUAL (INCORRECTO - value en ingles)
<SelectItem value="Flyweight">Peso Mosca (125 lbs)</SelectItem>
<SelectItem value="Bantamweight">Peso Gallo (135 lbs)</SelectItem>
```
Esto guarda "Flyweight" en la BD pero muestra "Peso Mosca" al usuario.

---

### 4. Auth.tsx (REGISTRO)

**Problema - Valores por defecto (lineas 251-252):**
```tsx
weight_class: invitation.weight_class || 'Lightweight',  // INCORRECTO
country: 'HN',  // INCORRECTO - deberia ser 'Honduras'
```

---

## Plan de Correccion

### Fase 1: Corregir UserFighterProfileEditForm.tsx

**1.1 Agregar imports de constantes centralizadas:**
```tsx
import { 
  WEIGHT_CLASSES, 
  FIGHTER_LEVELS, 
  COUNTRIES 
} from '@/lib/constants/disciplines';
```

**1.2 Reemplazar select de Categoria de Peso (lineas 742-754):**
```tsx
<SelectContent>
  <SelectItem value="__none__" className="text-muted-foreground">
    -- Seleccionar --
  </SelectItem>
  {WEIGHT_CLASSES.map((wc) => (
    <SelectItem key={wc.value} value={wc.value}>
      {wc.label}
    </SelectItem>
  ))}
</SelectContent>
```

**1.3 Reemplazar select de Nivel (lineas 774-779):**
```tsx
<SelectContent>
  <SelectItem value="__none__" className="text-muted-foreground">
    -- Seleccionar --
  </SelectItem>
  {FIGHTER_LEVELS.map((level) => (
    <SelectItem key={level.value} value={level.value}>
      {level.label}
    </SelectItem>
  ))}
</SelectContent>
```

**1.4 Reemplazar input de Pais por Select (lineas 550-561):**
```tsx
<FormField
  control={form.control}
  name="country"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Pais</FormLabel>
      <Select 
        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)} 
        value={field.value || '__none__'}
      >
        <FormControl>
          <SelectTrigger className="min-h-[44px] touch-manipulation">
            <SelectValue placeholder="Seleccionar pais" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="__none__" className="text-muted-foreground">
            -- Seleccionar --
          </SelectItem>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**1.5 Actualizar valor por defecto de pais (linea 118):**
```tsx
country: profile.country || 'Honduras',  // en lugar de 'HN'
```

---

### Fase 2: Corregir FightersProfilesInvite.tsx

**2.1 Eliminar constante local y agregar import:**
```tsx
// ELIMINAR lineas 12-23 (const WEIGHT_CLASSES local)

// AGREGAR import
import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
```

**2.2 Actualizar valor por defecto (lineas 36 y 73):**
```tsx
weightClass: 'Peso Ligero',  // en lugar de 'Lightweight'
```

**2.3 Actualizar Select para usar labels (lineas 180-184):**
```tsx
{WEIGHT_CLASSES.map((wc) => (
  <SelectItem key={wc.value} value={wc.value}>
    {wc.label}
  </SelectItem>
))}
```

---

### Fase 3: Corregir EventosPelea.tsx

**3.1 Agregar import:**
```tsx
import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
```

**3.2 Reemplazar select de categorias (lineas 1258-1268):**
```tsx
<SelectContent>
  {WEIGHT_CLASSES.map((wc) => (
    <SelectItem key={wc.value} value={wc.value}>
      {wc.label}
    </SelectItem>
  ))}
</SelectContent>
```

---

### Fase 4: Corregir Auth.tsx

**4.1 Actualizar valores por defecto (lineas 251-252):**
```tsx
weight_class: invitation.weight_class || 'Peso Ligero',
country: 'Honduras',
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/UserFighterProfileEditForm.tsx` | Import constantes + reemplazar 3 selects + valor por defecto |
| `src/pages/admin/FightersProfilesInvite.tsx` | Eliminar constante local + import + valor por defecto |
| `src/pages/admin/EventosPelea.tsx` | Import + reemplazar select |
| `src/pages/Auth.tsx` | Corregir valores por defecto |

---

## Compatibilidad Movil

Todos los nuevos `<Select>` mantendran:
- `min-h-[44px]` para area de toque accesible
- `touch-manipulation` para respuesta tactil rapida
- Clases responsivas existentes (`xs:`, `sm:`, `md:`)

---

## Resultado Esperado

Despues de implementar:

1. **Usuario edita perfil** → Ve "Peso Ligero (155 lbs)" en lugar de "Lightweight"
2. **Admin crea invitacion** → Selecciona de lista en espanol con libras
3. **Admin crea pelea** → Categorias consistentes con el resto de la plataforma
4. **Nuevo registro** → Valores por defecto correctos en espanol

---

## Sincronizacion Automatica

Al usar las mismas constantes centralizadas en todos los formularios:
- Los datos guardados en BD seran coherentes
- Los triggers de sincronizacion a rankings funcionaran correctamente
- Los eventos de actualizacion en tiempo real propagaran los cambios a todos los modulos
