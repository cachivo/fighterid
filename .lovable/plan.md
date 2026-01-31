
# Plan: Actualizar Logo Principal del Hero

## Análisis

El Hero actualmente usa `/lovable-uploads/fighter-id-logo-neon-outline.png` en dos lugares:
1. **Hero para usuarios no autenticados** (línea 35)
2. **Hero para usuarios autenticados** (línea 103)

### Nuevo Logo
El logo que subiste es un diseño limpio con "FID" en grande y "FIGHTER ID" debajo, fondo oscuro con texto blanco. Tiene proporciones más horizontales que el logo actual (que es más vertical/cuadrado).

## Cambios Necesarios

### 1. Copiar el nuevo logo
Guardar el archivo como `/public/lovable-uploads/fighter-id-logo-official.png`

### 2. Actualizar Hero.tsx
Cambiar ambas referencias del logo y ajustar las dimensiones para las nuevas proporciones:

| Ubicación | Clase Actual | Nueva Clase |
|-----------|--------------|-------------|
| No autenticado | `h-64 sm:h-[22rem] md:h-[28rem] lg:h-[32rem]` | `h-32 sm:h-40 md:h-48 lg:h-56` |
| Autenticado | `h-56 sm:h-72 md:h-96 lg:h-[28rem]` | `h-28 sm:h-36 md:h-44 lg:h-52` |

Las dimensiones se reducen porque el nuevo logo es más ancho y menos alto, así que necesita menos altura para verse proporcionado.

### 3. Remover animación neon (opcional)
El nuevo logo es blanco sólido sin efecto neón, así que `animate-pulse-neon-intense` podría no ser apropiado. Sugiero mantener una sutil animación o removerla.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `public/lovable-uploads/fighter-id-logo-official.png` | Nuevo archivo (copiar) |
| `src/components/Hero.tsx` | Actualizar src y clases de dimensión |

## Resultado Visual

```
ANTES (logo vertical con neón):
┌─────────────────────────────────┐
│                                 │
│         [LOGO NEÓN]             │  ← Muy alto
│         (vertical)              │
│                                 │
│    Plataforma profesional...    │
└─────────────────────────────────┘

DESPUÉS (logo horizontal limpio):
┌─────────────────────────────────┐
│                                 │
│      [  FID  ]                  │  ← Proporcional
│    [ FIGHTER ID ]               │
│                                 │
│    Plataforma profesional...    │
└─────────────────────────────────┘
```

## Detalles Técnicos

```typescript
// Hero.tsx - Usuario no autenticado (línea 35)
<img 
  src="/lovable-uploads/fighter-id-logo-official.png" 
  alt="Fighter ID"
  className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto mx-auto transition-all duration-500"
/>

// Hero.tsx - Usuario autenticado (línea 103)
<img 
  src="/lovable-uploads/fighter-id-logo-official.png" 
  alt="Fighter ID Logo"
  className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto mx-auto"
/>
```

## Beneficios
- Logo oficial actualizado en toda la app
- Dimensiones optimizadas para las nuevas proporciones
- Sin distorsión visual
- Consistencia de marca
