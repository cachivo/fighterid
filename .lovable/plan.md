

# Plan: Actualizar Logo Principal

## Cambio

| Acción | Detalle |
|--------|---------|
| Copiar archivo | `user-uploads://Fighter_ID_Logo.PNG` → `public/lovable-uploads/fighter-id-logo-official.png` |

## Archivos que usan este logo

El logo se usa en `src/components/Hero.tsx`:
- Línea 35: Hero para usuarios no autenticados
- Línea 103: Hero para usuarios autenticados

## Nota sobre el fondo

El nuevo logo tiene fondo oscuro/negro. Si prefieres una versión con fondo transparente para mejor integración con la página, avísame.

## Sin cambios de código

Las dimensiones actuales (`h-32` a `h-56`) funcionarán correctamente con el nuevo logo ya que tiene proporciones similares.

