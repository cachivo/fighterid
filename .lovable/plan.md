

# Auditoría de Rankings — Corregir visibilidad de HHF y separar FEDEHBOX

## Hallazgos de la auditoría

| Problema | Causa raíz |
|----------|------------|
| HHF no aparece en el feed | El home arranca en `UCC_MMA` (MMA). Para ver HHF hay que cambiar a la pestaña BOXEO; muchos usuarios nunca lo hacen. |
| HHF y FEDEHBOX se muestran como pestañas pequeñas | En `LeagueSelector` ambas organizaciones de Boxeo aparecen como toggles compactos, sin jerarquía visual clara. |
| FEDEHBOX no es percibida como ranking independiente | Comparte selector con HHF. Visualmente parece "una variante" de la misma liga. |
| Datos en DB están correctos | HHF_AMATEUR: 17 peleadores activos · FEDEHBOX: 3 · UCC_MMA: 57 |

## Solución propuesta

Renderizar **un listado por organización** en el home (UCC_MMA, HHF_AMATEUR, FEDEHBOX), cada uno como su propia sección con encabezado, stats y tabla. El selector de disciplina/liga deja de ser obligatorio para descubrir rankings.

### Cambios

**1. `src/pages/Index.tsx`**
- Eliminar el estado `selectedOrg` y el `LeagueSelector` del home.
- Renderizar tres componentes `<Ranking>` en orden: `UCC_MMA`, `HHF_AMATEUR`, `FEDEHBOX`.
- Cada sección queda separada por un divisor sutil; cada una mantiene su propio título grande ("RANKING UCC MMA", "RANKING HHF AMATEUR", "RANKING FEDEHBOX") gracias al texto dinámico ya existente.

**2. `src/components/sections/Ranking.tsx`**
- Recibir prop opcional `compact?: boolean` (default `false`). Cuando `true`:
  - Muestra solo top 5 peleadores (sin infinite scroll).
  - Oculta filtros de peso/género (mantiene tabs de nivel solo si la org tiene >1 nivel).
  - Botón "Ver ranking completo" navega a `/fighters?org=<code>`.
- En el home se usa `compact` para los tres bloques, evitando una página gigante.
- Cuando `compact=false` (uso desde otras páginas), todo sigue igual.

**3. `src/components/sections/LeagueSelector.tsx`**
- Sigue existiendo; se mueve a la página `/fighters` (donde ya tiene sentido el filtrado profundo). No se elimina código, solo se desacopla del home.

**4. `src/pages/Fighters.tsx`**
- Aceptar query param `?org=<code>` para preseleccionar la organización al venir desde un botón "Ver ranking completo" del home.

## Layout resultante en el home

```text
[HERO]
[FighterIDCallToAction / QuickStats]

────── RANKING UCC MMA ──────
   [stats] [top 5] [Ver ranking completo →]

────── RANKING HHF AMATEUR ──────
   [stats] [top 5] [Ver ranking completo →]

────── RANKING FEDEHBOX ──────
   [stats] [top 5] [Ver ranking completo →]

[GymShowcase] [StrategicAllies] [Footer]
```

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Quitar `LeagueSelector`/`selectedOrg`; renderizar 3 `<Ranking compact>` |
| `src/components/sections/Ranking.tsx` | Agregar prop `compact` (top 5, sin filtros de peso/género, botón "ver completo") |
| `src/pages/Fighters.tsx` | Leer `?org=` de la URL para preseleccionar liga |
| `src/components/sections/LeagueSelector.tsx` | Sin cambios funcionales (sigue usándose en `/fighters`) |

