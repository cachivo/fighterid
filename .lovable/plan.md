

# Vista Unificada `vision_fight_context` + Enriquecer `/start`

## Problema

El endpoint `/start` hace:
```sql
fighter_a:fighter_profiles!fights_fighter_a_id_fkey(id, name)
```
La columna `name` es nullable y generalmente vacía. Los nombres reales están en `first_name` + `last_name`. Resultado: el motor recibe `"Fighter A"` siempre.

## Cambios

### 1. Migration — Crear la vista `vision_fight_context`

Adaptada al schema real (columnas correctas):

```sql
CREATE OR REPLACE VIEW public.vision_fight_context AS
SELECT 
  f.id AS fight_id,
  f.event_id,
  f.fight_number,
  f.status,
  f.weight_class,
  
  -- Fighter A (red corner)
  fp1.id AS fighter_a_id,
  COALESCE(fp1.name, fp1.first_name || ' ' || fp1.last_name) AS fighter_a_name,
  fp1.nickname AS fighter_a_nickname,
  fp1.weight_class AS fighter_a_weight,
  fp1.record_wins AS fighter_a_wins,
  fp1.record_losses AS fighter_a_losses,
  fp1.record_draws AS fighter_a_draws,

  -- Fighter B (blue corner)
  fp2.id AS fighter_b_id,
  COALESCE(fp2.name, fp2.first_name || ' ' || fp2.last_name) AS fighter_b_name,
  fp2.nickname AS fighter_b_nickname,
  fp2.weight_class AS fighter_b_weight,
  fp2.record_wins AS fighter_b_wins,
  fp2.record_losses AS fighter_b_losses,
  fp2.record_draws AS fighter_b_draws,

  -- Event
  e.name AS event_name,
  e.start_time AS event_date,
  e.venue AS event_venue

FROM fights f
LEFT JOIN fighter_profiles fp1 ON f.fighter_a_id = fp1.id
LEFT JOIN fighter_profiles fp2 ON f.fighter_b_id = fp2.id
LEFT JOIN bdg_event e ON f.event_id = e.id;
```

Nota clave: `COALESCE(name, first_name || ' ' || last_name)` garantiza que si `name` está vacío, se genera el nombre completo.

### 2. Edge Function `ai-strike-ingest` — Usar la vista en `/start`

Cambiar el select del endpoint `/start` para usar la vista en vez de joins manuales:

```ts
const { data: ctx } = await supabase
  .from('vision_fight_context')
  .select('*')
  .eq('fight_id', fight_id)
  .maybeSingle();
```

Y devolver datos enriquecidos:

```json
{
  "session_id": "...",
  "fight_id": "...",
  "fighters": {
    "red": {
      "id": "...",
      "name": "Juan Pérez",
      "nickname": "El Tigre",
      "record": "5-2-0",
      "weight_class": "welterweight"
    },
    "blue": { ... }
  },
  "event": {
    "name": "Batalla Championship 3",
    "date": "2026-03-22",
    "venue": "Arena MX"
  }
}
```

### 3. Frontend — Telemetry hook usa nombres reales

El `useFightTelemetry` ya hace queries separadas a `fighter_profiles` con `first_name, last_name`, así que el HUD ya funciona. Pero el `/start` response con nombres correctos beneficia directamente al motor Python (para logging, overlays, etc.).

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Vista `vision_fight_context` |
| `supabase/functions/ai-strike-ingest/index.ts` | `/start` usa la vista, devuelve datos enriquecidos |

