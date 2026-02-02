
# Plan: Auditoría de Base de Datos y Corrección del Flujo de Creación de Perfiles

## Resumen Ejecutivo
Se encontraron **45 perfiles** con categorías de peso en inglés que necesitan actualización, y **múltiples problemas en los componentes Select** del formulario de onboarding que causan crashes.

---

## Parte 1: Auditoría de Base de Datos - Categorías de Peso

### Problema Identificado
La base de datos tiene inconsistencias en `weight_class`:

| Categoría en Inglés | Cantidad | Debe ser (Español) |
|---------------------|----------|-------------------|
| Flyweight | 14 | Peso Mosca |
| Bantamweight | 6 | Peso Gallo |
| Featherweight | 6 | Peso Pluma |
| Lightweight | 8 | Peso Ligero |
| Welterweight | 6 | Peso Welter |
| Middleweight | 3 | Peso Medio |
| Strawweight | 2 | Peso Paja |
| **Total** | **45** | |

### Perfiles Afectados (Ejemplos)
- Kevin Martinez Cruz - Bantamweight
- Clara Pinto - Flyweight
- Willis Yang - Lightweight
- Cesar Bonilla - Middleweight

### Solución: Migración SQL
```sql
UPDATE fighter_profiles SET weight_class = 'Peso Paja' WHERE weight_class = 'Strawweight';
UPDATE fighter_profiles SET weight_class = 'Peso Mosca' WHERE weight_class = 'Flyweight';
UPDATE fighter_profiles SET weight_class = 'Peso Gallo' WHERE weight_class = 'Bantamweight';
UPDATE fighter_profiles SET weight_class = 'Peso Pluma' WHERE weight_class = 'Featherweight';
UPDATE fighter_profiles SET weight_class = 'Peso Ligero' WHERE weight_class = 'Lightweight';
UPDATE fighter_profiles SET weight_class = 'Peso Welter' WHERE weight_class = 'Welterweight';
UPDATE fighter_profiles SET weight_class = 'Peso Medio' WHERE weight_class = 'Middleweight';
UPDATE fighter_profiles SET weight_class = 'Peso Semipesado' WHERE weight_class = 'Light Heavyweight';
UPDATE fighter_profiles SET weight_class = 'Peso Pesado' WHERE weight_class = 'Heavyweight';
```

### También necesita corrección: Función `import_fighter_data`
La función de base de datos genera categorías en inglés. Debe actualizarse para usar español.

---

## Parte 2: Corrección del Selector de Género (y otros Selects)

### Problema Identificado
En `LicenseOnboarding.tsx`, el selector de género usa:
```tsx
value={formData.gender || undefined}
```

**Problema**: Cuando `gender` es cadena vacía `''`, se pasa `undefined`, lo cual causa comportamiento inestable en Radix UI Select.

### Otros Selects con el mismo patrón problemático:
| Campo | Línea | Código Actual |
|-------|-------|---------------|
| Level | 340 | `value={formData.level}` |
| Weight Class | 429 | `value={formData.weightClass}` |
| Stance | 447 | `value={formData.stance}` |

### Solución: Usar placeholder `__none__`
Aplicar el mismo patrón usado anteriormente:

```tsx
// ANTES (problemático)
<Select value={formData.gender || undefined}>

// DESPUÉS (correcto)
<Select value={formData.gender || '__none__'} 
        onValueChange={(v) => setFormData({...formData, gender: v === '__none__' ? '' : v})}>
```

---

## Parte 3: Análisis del Flujo de Creación de Perfiles

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CREACIÓN DE PERFIL                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [1] Usuario en /license/auth                                      │
│        ↓                                                            │
│   [2] Login/Registro exitoso                                        │
│        ↓                                                            │
│   [3] Redirección a /license/onboarding                             │
│        ↓                                                            │
│   [4] PASO 1: Datos Personales ◄─── PROBLEMAS AQUÍ                 │
│       • Nombre/Apellido (OK)                                        │
│       • Género ← BUG: Select crashea                                │
│       • Disciplinas ← CORREGIDO                                     │
│       • Nivel ← RIESGO: mismo patrón                                │
│       • Categoría Peso ← RIESGO: mismo patrón                       │
│        ↓                                                            │
│   [5] PASO 2: Documentos                                            │
│       • Foto de identidad                                           │
│       • Foto de peleador                                            │
│        ↓                                                            │
│   [6] Envío → createProfile()                                       │
│        ↓                                                            │
│   [7] Redirección a /license/pending                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Puntos Críticos Identificados

| # | Campo | Estado | Riesgo |
|---|-------|--------|--------|
| 1 | Disciplinas (MMA/Boxeo) | ✅ Corregido | Bajo |
| 2 | Género | ❌ Con bug | **Alto** |
| 3 | Nivel | ⚠️ Potencial | Medio |
| 4 | Stance | ⚠️ Potencial | Medio |
| 5 | Categoría de Peso | ⚠️ Potencial | Medio |

---

## Resumen de Cambios a Implementar

### Archivo 1: `src/pages/license/LicenseOnboarding.tsx`

| Ubicación | Cambio |
|-----------|--------|
| Línea 246-260 | Corregir Select de Género con patrón `__none__` |
| Línea 339-363 | Corregir Select de Nivel con patrón `__none__` |
| Línea 429-440 | Corregir Select de Categoría de Peso con patrón `__none__` |
| Línea 447-460 | Corregir Select de Stance con patrón `__none__` |

### Base de Datos: Migración de Datos

| Acción | Descripción |
|--------|-------------|
| UPDATE | Cambiar 45 registros de inglés a español |
| ALTER FUNCTION | Actualizar `import_fighter_data` para usar español |

---

## Sección Técnica

### Patrón Correcto para Selects con Radix UI

```tsx
// Estado inicial
const [formData, setFormData] = useState({
  gender: '' as 'M' | 'F' | 'Otro' | '',
});

// Componente Select
<Select 
  value={formData.gender || '__none__'} 
  onValueChange={(value) => setFormData({
    ...formData, 
    gender: value === '__none__' ? '' : value as 'M' | 'F' | 'Otro'
  })}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona tu género" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__none__">-- Sin selección --</SelectItem>
    <SelectItem value="M">Masculino</SelectItem>
    <SelectItem value="F">Femenino</SelectItem>
    <SelectItem value="Otro">Otro</SelectItem>
  </SelectContent>
</Select>
```

### SQL para Actualizar Función de Importación

```sql
CREATE OR REPLACE FUNCTION public.import_fighter_data(...)
-- Cambiar la lógica del CASE:
  CASE 
    WHEN p_weight_lbs <= 115 THEN v_weight_class := 'Peso Paja';
    WHEN p_weight_lbs <= 125 THEN v_weight_class := 'Peso Mosca';  
    WHEN p_weight_lbs <= 135 THEN v_weight_class := 'Peso Gallo';
    WHEN p_weight_lbs <= 145 THEN v_weight_class := 'Peso Pluma';
    WHEN p_weight_lbs <= 155 THEN v_weight_class := 'Peso Ligero';
    WHEN p_weight_lbs <= 170 THEN v_weight_class := 'Peso Welter';
    WHEN p_weight_lbs <= 185 THEN v_weight_class := 'Peso Medio';
    WHEN p_weight_lbs <= 205 THEN v_weight_class := 'Peso Semipesado';
    ELSE v_weight_class := 'Peso Pesado';
  END CASE;
```

---

## Orden de Implementación

1. **Primero**: Corregir todos los Selects en `LicenseOnboarding.tsx`
2. **Segundo**: Ejecutar migración SQL para actualizar los 45 registros
3. **Tercero**: Actualizar la función `import_fighter_data`
4. **Cuarto**: Probar el flujo completo de creación de perfil
