

# Auditoria Completa: AdminFighterForm - Mobile-First y Estabilidad

## Problemas Detectados

### 1. Grids no responsivos para movil
Multiples grids usan `grid-cols-3` y `grid-cols-4` sin breakpoints moviles. En pantallas de 375px esto comprime los campos hasta ser inutilizables:

- **Linea 437**: `grid-cols-3` para sangre/documento/numero -- 3 columnas en movil es ilegible
- **Linea 476**: `grid-cols-3` para contacto emergencia -- campos cortados
- **Linea 609**: `grid-cols-3` para altura/peso/alcance -- muy apretado
- **Linea 851**: `grid-cols-4` para records -- imposible en movil
- **Linea 911/952**: `grid-cols-3` para records MMA/Boxeo

### 2. Campos numericos envian 0 en vez de null
Cuando `height_cm`, `weight_kg`, `reach_cm` se dejan vacios, envian `0` a la BD. Un peleador con altura 0cm no tiene sentido. Deberian enviarse como `null`.

### 3. El `grid-cols-3` de "Tipo de Sangre + Tipo Doc + Num Doc" no funciona en movil
Estos 3 campos con Select + Select + Input en una fila de 3 columnas se aplastan completamente.

### 4. Labels cortados en campos comprimidos
Labels como "Teléfono Emergencia", "Compañía de Seguro", "Número de Documento" se truncan en grid-cols-3.

## Solucion

### Archivo: `src/components/admin/AdminFighterForm.tsx`

**1. Convertir todos los grids a mobile-first:**

| Actual | Corregido |
|--------|-----------|
| `grid-cols-3` (linea 437) | `grid-cols-1 sm:grid-cols-3` |
| `grid-cols-3` (linea 476) | `grid-cols-1 sm:grid-cols-3` |
| `grid-cols-2` (linea 506) | `grid-cols-1 sm:grid-cols-2` |
| `grid-cols-2` (linea 529) | `grid-cols-1 sm:grid-cols-2` |
| `grid-cols-3` (linea 609) | `grid-cols-3` (este es OK, son numeros cortos) |
| `grid-cols-4` (linea 851) | `grid-cols-2 sm:grid-cols-4` |
| `grid-cols-3` (linea 911) | `grid-cols-3` (numeros, OK) |
| `grid-cols-3` (linea 952) | `grid-cols-3` (numeros, OK) |
| `grid-cols-2` (linea 359) | `grid-cols-1 sm:grid-cols-2` |
| `grid-cols-2` (linea 691) | `grid-cols-1 sm:grid-cols-2` |

**2. Proteger campos numericos contra 0 falso:**

Cambiar `value={formData.height_cm || ''}` a un patron que distinga 0 explicito de vacio. En el submit, enviar `null` si el valor es 0 para height/weight/reach.

**3. Enviar campos numericos como null cuando estan vacios:**

En `handleSubmit`, antes de enviar al RPC, limpiar los 0 falsos:
```text
const cleanedData = {
  ...formData,
  height_cm: formData.height_cm || null,
  weight_kg: formData.weight_kg || null,
  reach_cm: formData.reach_cm || null,
};
```

### Archivo: `src/pages/admin/FightersProfilesCreate.tsx`

**4. Reducir padding para movil:**

Cambiar `container max-w-5xl mx-auto p-6` a `container max-w-5xl mx-auto p-4 sm:p-6` y reducir el titulo de `text-3xl` a `text-xl sm:text-3xl`.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminFighterForm.tsx` | Grids responsive + limpieza de 0s falsos |
| `src/pages/admin/FightersProfilesCreate.tsx` | Padding y titulo mobile-first |

**2 archivos. Sin migraciones SQL.**

