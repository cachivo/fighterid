
# Optimizacion de Logos con Diferentes Aspect Ratios

## Problema Identificado

Los logos de aliados estrategicos tienen diferentes proporciones:
- **Team Lunaticos**: Logo horizontal (se ve cortado/pequeño)
- **Honduras Hood Fights**: Logo cuadrado (se ve bien)
- **UCC**: Logo cuadrado (se ve bien)

El contenedor actual es cuadrado fijo (`w-20 h-20`) y `OptimizedImage` usa `object-cover` hardcodeado, causando que logos horizontales se corten o se vean muy pequeños.

---

## Solucion Propuesta

### Fase 1: Mejorar OptimizedImage (Flexibilidad)

Agregar prop `objectFit` al componente para permitir `contain` o `cover`:

```tsx
interface OptimizedImageProps {
  // ... existing props
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

// En el img:
className={cn(
  "absolute inset-0 w-full h-full transition-opacity duration-300",
  objectFit === 'contain' ? 'object-contain' : 
  objectFit === 'fill' ? 'object-fill' : 
  objectFit === 'none' ? 'object-none' : 'object-cover',
  isLoaded ? "opacity-100" : "opacity-0"
)}
```

### Fase 2: Redisenar Contenedor de Logos

Cambiar el contenedor de logo fijo cuadrado a uno flexible que respete aspect ratios:

**Antes (problematico):**
```tsx
<div className="w-20 h-20 sm:w-24 sm:h-24 ... overflow-hidden">
  <OptimizedImage className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
</div>
```

**Despues (flexible):**
```tsx
<div className="w-full h-20 sm:h-24 max-w-[160px] mx-auto bg-white/10 rounded-lg flex items-center justify-center p-3">
  <OptimizedImage 
    className="w-full h-full"
    objectFit="contain"  // NUEVO PROP
  />
</div>
```

Beneficios:
- Contenedor mas ancho (160px max) para acomodar logos horizontales
- `objectFit="contain"` asegura que nunca se corte
- Padding interno (`p-3`) evita que logos toquen los bordes
- Logos cuadrados se centran automaticamente

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/optimized-image.tsx` | Agregar prop `objectFit` con default `cover` |
| `src/components/StrategicAllies.tsx` | Contenedor flexible + usar `objectFit="contain"` |

---

## Visualizacion del Cambio

```
ANTES (Logo Horizontal Cortado):
+--------+
|  ████  |  <- Logo comprimido/cortado
+--------+

DESPUES (Logo Horizontal Completo):
+----------------+
|   █████████    |  <- Logo completo, centrado
+----------------+
```

---

## Seccion Tecnica

### Detalles de Implementacion

**OptimizedImage - Nuevo prop:**
```tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'; // NUEVO
  onLoad?: () => void;
  onError?: () => void;
}
```

**StrategicAllies - Contenedor mejorado:**
```tsx
<div className="mb-4 flex justify-center">
  <div className="w-full max-w-[140px] h-20 sm:h-24 bg-white/10 rounded-lg flex items-center justify-center p-2 sm:p-3 group-hover:bg-white/20 transition-colors">
    {partner.logo ? (
      <OptimizedImage
        src={partner.logo}
        alt={partner.nombre}
        className="w-full h-full"
        objectFit="contain"
        priority={index < 3}
        fallbackIcon={...}
      />
    ) : ...}
  </div>
</div>
```

### Por que object-contain es mejor para logos

| Propiedad | Comportamiento | Uso ideal |
|-----------|----------------|-----------|
| `object-cover` | Recorta para llenar | Fotos de personas, backgrounds |
| `object-contain` | Escala sin cortar | Logos, iconos, graficos |

### Compatibilidad

Esta solucion es 100% CSS, sin dependencias adicionales. Funciona en todos los navegadores modernos.
