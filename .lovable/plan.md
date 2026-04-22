

# Refinar nomenclatura y jerarquía de ligas

## Lógica oficial confirmada

| Código | Nombre completo | Tipo | Niveles | Disciplina |
|--------|-----------------|------|---------|------------|
| `FEDEHBOX` | Federación Hondureña de Boxeo Amateur | **Liga Nacional Olímpica** (oficial) | Olímpico, Profesional, Semi-profesional | Boxeo |
| `HHF_AMATEUR` | Honduras Hood Fights | **Minor League** (eventos de barrio) | Amateur | Boxeo |
| `UCC_MMA` | Ultimate Combat Championship Honduras | Liga oficial MMA | Amateur, Semi-profesional, Profesional | MMA |

La lógica de auto-inscripción ya funciona correctamente (migraciones `20260401233043` y `20260205050724`):
- Boxeo Amateur → HHF_AMATEUR
- Boxeo Olímpico/Pro/Semi → FEDEHBOX
- MMA → UCC_MMA

Solo faltan ajustes de **nomenclatura visible** y **jerarquía visual**.

## Cambios

### 1. Migración SQL — Actualizar nombres y descripciones

```sql
UPDATE ranking_organizations
SET 
  name = 'Federación Hondureña de Boxeo Amateur',
  description = 'Liga Nacional Olímpica oficial de Honduras — niveles Olímpico, Profesional y Semi-profesional'
WHERE code = 'FEDEHBOX';

UPDATE ranking_organizations
SET 
  name = 'Honduras Hood Fights',
  short_name = 'HHF',
  description = 'Minor League — boxeo amateur de barrio'
WHERE code = 'HHF_AMATEUR';

UPDATE ranking_organizations
SET 
  description = 'Ranking oficial de MMA en Honduras (disciplina independiente)'
WHERE code = 'UCC_MMA';
```

### 2. `src/pages/Index.tsx` — Reordenar y agregar separadores temáticos

Reordenar para que la jerarquía sea evidente:

```text
RANKING UCC MMA          ← Disciplina MMA (independiente)
─────────────────────
[Sección Boxeo]
RANKING FEDEHBOX         ← Liga Nacional Olímpica (oficial)
RANKING HHF              ← Minor League
```

Agregar un encabezado de sección "BOXEO" que agrupe visualmente FEDEHBOX y HHF, dejando MMA como disciplina aparte arriba.

### 3. `src/pages/admin/Dashboard.tsx`

Actualizar el card de "Boxeo" para reflejar la jerarquía:
- Reemplazar "Boxeo Profesional y Olímpico" por "Liga Nacional Olímpica + Minor League"
- Badges: `FEDEHBOX (Oficial)` y `HHF (Minor League)`

### 4. `src/components/sections/LeagueSelector.tsx`

En la página `/fighters`, cuando se selecciona Boxeo, mostrar un subtítulo aclaratorio sobre cada org:
- FEDEHBOX → "Liga Nacional Olímpica"
- HHF → "Minor League Amateur"

(Ya se muestra `org.description` debajo, así que el cambio en DB se refleja automáticamente.)

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Actualizar `name`, `short_name` y `description` de las 3 organizaciones |
| `src/pages/Index.tsx` | Encabezado "BOXEO" agrupando FEDEHBOX + HHF; MMA arriba como disciplina aparte |
| `src/pages/admin/Dashboard.tsx` | Badges y subtítulos del card de Boxeo |

## Lo que NO cambia

- La lógica de auto-inscripción y migración de niveles (ya funciona).
- Los códigos internos (`FEDEHBOX`, `HHF_AMATEUR`, `UCC_MMA`) — solo cambian etiquetas visibles.
- La separación MMA / Boxeo en el sistema admin segregado por disciplina.

