

# Fix: Ranking Amateur no precargado al volver al Home

## Causa raíz

En `Ranking.tsx` línea 23, `selectedLevel` inicia como `''` (vacío). El efecto que selecciona 'Amateur' automáticamente (líneas 51-64) depende de que `availableLevels` se cargue primero desde la query de organizaciones. Durante ese gap:

1. La query de ranking se dispara con `level=undefined` (sin filtro de nivel)
2. La condición de skeleton en línea 240 muestra esqueletos mientras `!selectedLevel`
3. El usuario ve un estado vacío/cargando hasta que el efecto finalmente dispara

Si hay algún delay en la carga de organizaciones o si el efecto no alcanza a dispararse antes de que el usuario interactúe, queda sin selección.

## Solución

Inicializar `selectedLevel` directamente como `'Amateur'` en vez de `''`. Esto garantiza que:
- La primera query ya filtra por Amateur inmediatamente
- El tab de Amateur aparece seleccionado desde el inicio
- No hay gap visual ni necesidad de esperar el efecto

## Cambio

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/Ranking.tsx` | Línea 23: cambiar `useState('')` a `useState('Amateur')` |

**1 línea en 1 archivo.**

