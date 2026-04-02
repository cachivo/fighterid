

# Echo Stack en Títulos de Sección

## Resumen

Agregar el efecto tipográfico echo-stack (capas de texto con offset) a los títulos de las 3 secciones principales del home, replicando el patrón ya implementado en el Hero.

## Cambios

### 1. `src/components/sections/GymShowcase.tsx`

Reemplazar el `<h2>` simple por un bloque echo-stack con 4 capas + foreground. Texto: "ESCUELAS DE COMBATE". Aplicar en ambos estados (loading y loaded). Escala más pequeña que el Hero (text-xl a text-3xl).

### 2. `src/components/StrategicAllies.tsx`

Mismo patrón echo-stack en el `<h2>` "ALIADOS ESTRATÉGICOS". 4 capas echo + foreground con la palabra clave en `text-primary`.

### 3. `src/components/sections/Ranking.tsx`

Echo-stack en el `<h2>` del ranking. El nombre de la organización (`currentOrg?.short_name`) se mantiene en `text-primary` en la capa foreground. Las capas echo muestran el texto completo en los tonos grises definidos.

### Patrón reutilizado (de Hero.tsx)

```tsx
<div className="relative inline-block">
  <span aria-hidden="true" className="echo-layer echo-4 ufc-label text-xl sm:text-2xl md:text-3xl font-bold tracking-display">TÍTULO</span>
  <span aria-hidden="true" className="echo-layer echo-3 ...">TÍTULO</span>
  <span aria-hidden="true" className="echo-layer echo-2 ...">TÍTULO</span>
  <span aria-hidden="true" className="echo-layer echo-1 ...">TÍTULO</span>
  <h2 className="relative ufc-label text-xl sm:text-2xl md:text-3xl font-bold tracking-display text-white">
    TÍTULO <span className="text-primary">ACENTO</span>
  </h2>
</div>
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/sections/GymShowcase.tsx` | Echo stack en título (loading + loaded) |
| `src/components/StrategicAllies.tsx` | Echo stack en título |
| `src/components/sections/Ranking.tsx` | Echo stack en título con org name |

