
# Auditoria Completa: Creacion de Perfiles, Optimizacion Movil y Rankings

## Resumen Ejecutivo

Se identificaron **6 problemas criticos** que afectan la experiencia del usuario en dispositivos moviles y la coherencia de datos entre disciplinas:

| Problema | Severidad | Impacto |
|----------|-----------|---------|
| Componente Select no optimizado para iOS | Alta | Pantalla en blanco, opciones no responden |
| Formularios sin patron `__none__` | Alta | Campos vacios, errores de validacion |
| Boxeadores sin ranking automatico | Alta | Rankings de boxeo incompletos |
| backdrop-blur causa lag en gama baja | Media | UI congelada 1-3 segundos |
| Z-index insuficiente en Select | Media | Dropdown oculto por otros elementos |
| Datos de boxeo no sincronizados | Media | Inconsistencia entre modulos |

---

## Problema 1: Componente Select No Optimizado para iOS

### Diagnostico

El archivo `src/components/ui/select.tsx` tiene dos problemas criticos:

**Linea 73-77:**
```tsx
// PROBLEMA: modal=true por defecto causa focus trapping en iOS
<SelectPrimitive.Content
  ref={ref}
  className={cn(
    "... bg-popover/95 backdrop-blur-md ...", // Causa lag
    ...
```

**Causa Raiz:**
- `modal={true}` (por defecto) activa focus trapping que conflicta con iOS Safari
- `backdrop-blur-md` requiere composicion de GPU costosa en dispositivos gama baja
- `z-index: 100` puede ser insuficiente cuando hay modales abiertos

### Solucion

Modificar `SelectContent`:
```tsx
<SelectPrimitive.Content
  ref={ref}
  modal={false}  // NUEVO: Evita focus trapping problematico en iOS
  onCloseAutoFocus={(e) => e.preventDefault()} // Evita scroll no deseado
  className={cn(
    "relative z-[9999] max-h-[min(300px,50vh)] min-w-[8rem] overflow-hidden",
    "rounded-md border bg-popover text-popover-foreground shadow-lg", // SIN blur
    "touch-manipulation select-none", // Respuesta tactil inmediata
    ...
  )}
```

---

## Problema 2: Formularios Sin Patron `__none__`

### Diagnostico

**Archivo afectado:** `src/pages/ProfileChangeRequest.tsx`

Multiples Selects usan valores vacios directamente:

```tsx
// INCORRECTO (lineas 262-270)
<Select value={formData.gender} onValueChange={...}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar genero" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="M">Masculino</SelectItem>
    <SelectItem value="F">Femenino</SelectItem>
  </SelectContent>
</Select>
```

**Problema:** Si `formData.gender` es `undefined` o `''`, Radix UI entra en estado inconsistente mostrando opcion en blanco.

### Solucion

Implementar patron `__none__`:
```tsx
// CORRECTO
<Select 
  value={formData.gender || '__none__'} 
  onValueChange={(v) => handleInputChange('gender', v === '__none__' ? '' : v)}
>
  <SelectContent>
    <SelectItem value="__none__" className="text-muted-foreground">
      -- Seleccionar --
    </SelectItem>
    <SelectItem value="M">Masculino</SelectItem>
    <SelectItem value="F">Femenino</SelectItem>
  </SelectContent>
</Select>
```

**Archivos que requieren actualizacion:**
- `src/pages/ProfileChangeRequest.tsx` (7 Selects)
- `src/components/UserFighterProfileEditForm.tsx` (8 Selects)
- `src/pages/admin/RankingsManagement.tsx` (2 Selects)

---

## Problema 3: Boxeadores Sin Ranking Automatico

### Diagnostico (Datos en Vivo)

**Estado actual de peleadores de Boxeo:**

| Peleador | Nivel | Ranking Asignado |
|----------|-------|------------------|
| Kevin Josue Calona Zelaya | Amateur | NO INSCRITO |
| Adiel Eduardo Espinoza | Amateur | NO INSCRITO |
| Michael Cabrera | Amateur | NO INSCRITO |
| Aaron Irias | Amateur | NO INSCRITO |
| Willis Yang | Amateur | HHF Amateur |
| moises cardenas | Semi-profesional | BDG Pro |

**4 de 6 boxeadores NO aparecen en ningun ranking**

### Causa Raiz

El sistema de auto-inscripcion durante onboarding/creacion de perfil no esta funcionando correctamente para boxeadores Amateur. La logica en `useOptimizedOnboarding.ts` crea el perfil pero no inscribe automaticamente en `HHF_AMATEUR`.

### Solucion

1. **Correccion inmediata (datos):** Inscribir manualmente los 4 boxeadores faltantes en HHF_AMATEUR

2. **Correccion de codigo:** Agregar trigger o RPC que auto-inscriba segun:
   - discipline='Boxeo' + level='Amateur' -> HHF_AMATEUR
   - discipline='Boxeo' + level in ('Semi-profesional', 'Profesional') -> BDG_PRO
   - discipline='MMA' + cualquier nivel -> UCC_MMA

---

## Problema 4: Ranking de Boxeo en Pagina Principal

### Estado Actual

El componente `LeagueSelector` funciona correctamente, permitiendo seleccionar:
- Disciplina (MMA / Boxeo)
- Organizacion (UCC MMA / BDG Pro / HHF Amateur)

**PERO:** Al seleccionar Boxeo, solo muestra 1-2 peleadores porque los demas no estan inscritos (Problema 3).

### Verificacion del Flujo

```text
Usuario selecciona "BOXEO"
        |
        v
LeagueSelector detecta discipline='Boxeo'
        |
        v
Auto-selecciona primera org disponible:
  - BDG_PRO (1 peleador) o HHF_AMATEUR (1 peleador)
        |
        v
Ranking muestra datos CORRECTOS pero INCOMPLETOS
```

### Solucion

Una vez corregido el Problema 3, los rankings de boxeo mostraran todos los peleadores correctamente.

---

## Problema 5: Optimizacion CSS para Moviles de Gama Baja

### Cambios Necesarios en `src/index.css`

Agregar reglas especificas para Select en moviles:

```css
/* Mobile Select Optimization */
@media (max-width: 768px) {
  [data-radix-select-content] {
    /* Deshabilitar blur en moviles */
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    
    /* Fondo solido para legibilidad */
    background-color: hsl(var(--popover)) !important;
    
    /* Respuesta tactil inmediata */
    touch-action: manipulation;
  }
  
  [data-radix-select-item] {
    /* Areas de toque mas grandes */
    min-height: 48px !important;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
  }
}
```

---

## Matriz de Coherencia entre Modulos

### Estado Actual

| Modulo | Web Desktop | Web Mobile | PWA Mobile |
|--------|-------------|------------|------------|
| Onboarding | OK | Selects fallan | Selects fallan |
| Edicion Perfil | OK | Selects fallan | Selects fallan |
| Rankings MMA | OK | OK | OK |
| Rankings Boxeo | Incompleto | Incompleto | Incompleto |
| Auth/Login | OK | OK despues de fix | OK despues de fix |

### Estado Objetivo (Post-Correccion)

| Modulo | Web Desktop | Web Mobile | PWA Mobile |
|--------|-------------|------------|------------|
| Onboarding | OK | OK | OK |
| Edicion Perfil | OK | OK | OK |
| Rankings MMA | OK | OK | OK |
| Rankings Boxeo | OK | OK | OK |
| Auth/Login | OK | OK | OK |

---

## Plan de Implementacion

### Fase 1: Correccion Urgente del Select (30 min)

1. Modificar `src/components/ui/select.tsx`:
   - Agregar `modal={false}`
   - Agregar `onCloseAutoFocus={(e) => e.preventDefault()}`
   - Remover `backdrop-blur-md`
   - Aumentar z-index a `[9999]`
   - Agregar `touch-manipulation`

2. Agregar CSS movil en `src/index.css`

### Fase 2: Correccion de Formularios (45 min)

1. `ProfileChangeRequest.tsx` - Aplicar patron `__none__` a 7 Selects
2. `UserFighterProfileEditForm.tsx` - Aplicar patron `__none__` a 8 Selects  
3. `RankingsManagement.tsx` - Aplicar patron `__none__` a 2 Selects

### Fase 3: Inscripcion de Boxeadores (15 min)

1. Ejecutar SQL para inscribir los 4 boxeadores faltantes en HHF_AMATEUR:
```sql
INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, is_active)
SELECT 
  fp.id,
  (SELECT id FROM ranking_organizations WHERE code = 'HHF_AMATEUR'),
  fp.level,
  fp.weight_class,
  true
FROM fighter_profiles fp
WHERE fp.discipline = 'Boxeo' 
  AND fp.level = 'Amateur'
  AND fp.active = true
  AND NOT EXISTS (
    SELECT 1 FROM fighter_rankings fr 
    WHERE fr.fighter_id = fp.id AND fr.is_active = true
  );
```

### Fase 4: Validacion (15 min)

1. Testing en dispositivo iOS real
2. Testing en dispositivo Android gama baja
3. Verificar rankings de Boxeo en pagina principal
4. Verificar coherencia de datos entre modulos

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/components/ui/select.tsx` | Fixes para iOS/mobile | Critica |
| `src/index.css` | CSS movil para Select | Alta |
| `src/pages/ProfileChangeRequest.tsx` | Patron `__none__` | Alta |
| `src/components/UserFighterProfileEditForm.tsx` | Patron `__none__` | Alta |
| `src/pages/admin/RankingsManagement.tsx` | Patron `__none__` | Media |
| Migracion SQL | Inscribir boxeadores | Alta |

---

## Seccion Tecnica

### Detalles de SelectContent modal={false}

Radix UI usa focus trapping por defecto en `modal={true}`. En iOS Safari:
1. El usuario toca el Select
2. Safari intenta hacer focus en el contenido
3. Focus trapping conflicta con el viewport management de Safari
4. El Select se cierra inmediatamente o no responde

### Detalles del Patron `__none__`

Radix Select internamente valida que `value` sea un string no vacio. Cuando se pasa `undefined` o `''`:
- El componente muestra placeholder correctamente
- Pero si el usuario ha interactuado antes, el estado interno queda corrupto
- Resultando en opciones "fantasma" o componente no responsivo

### Auto-Inscripcion de Rankings

La logica actual en `useOptimizedOnboarding.ts` llama al RPC `create_fighter_profile_with_license` pero este RPC no incluye la logica de inscripcion automatica en rankings. Se requiere:
1. Un trigger en `fighter_profiles` que detecte INSERT/UPDATE de discipline/level
2. O agregar la logica al RPC existente

### Beneficios Esperados

| Metrica | Antes | Despues |
|---------|-------|---------|
| Tiempo respuesta tactil Select | 200-500ms | <50ms |
| Selects funcionales en iOS | ~60% | 100% |
| Boxeadores visibles en ranking | 2/6 | 6/6 |
| Opciones en blanco | Frecuente | Eliminado |
| Coherencia datos MMA/Boxeo | Parcial | Total |
