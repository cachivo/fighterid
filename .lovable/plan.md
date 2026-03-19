

# Script 1: Contrato Oficial del Motor de Visión AI

## Problema Actual

1. La Edge Function `ai-strike-ingest` no valida que el `fight_id` exista antes de insertar — causa error FK `23503` (visible en los logs)
2. El endpoint `/start` no devuelve los fighters de la pelea
3. La tabla `ai_inference_sessions` requiere `source_url` y `model_version` como NOT NULL, pero el contrato nuevo usa `device_id`
4. La tabla `fights` usa `fighter_a_id` / `fighter_b_id` (no `red_fighter_id` / `blue_fighter_id`) — el contrato del script debe adaptarse a este esquema real

## Cambios

### 1. Migración SQL — Adaptar `ai_inference_sessions`

```sql
-- Agregar device_id, hacer source_url y model_version opcionales
ALTER TABLE public.ai_inference_sessions
  ADD COLUMN IF NOT EXISTS device_id text,
  ALTER COLUMN source_url SET DEFAULT 'unknown',
  ALTER COLUMN source_url DROP NOT NULL,
  ALTER COLUMN model_version SET DEFAULT 'unknown',
  ALTER COLUMN model_version DROP NOT NULL;
```

### 2. Reescribir Edge Function `ai-strike-ingest/index.ts`

Implementar los 4 endpoints del contrato oficial:

**POST /start** — Valida fight_id, crea sesión, devuelve fighters
- Consulta `fights` + join a `fighter_profiles` via `fighter_a_id` / `fighter_b_id`
- Si fight_id no existe → `400 "fight_id inválido"`
- Inserta en `ai_inference_sessions` con `device_id` y `status: 'ACTIVE'`
- Responde con `{ session_id, fight_id, fighters: { red: {id, name}, blue: {id, name} } }`

**POST /event** — Valida fight_id antes de insertar
- Verifica que el fight_id existe en `fights`
- Inserta en `ai_strike_events` con los campos del contrato
- Responde `{ success: true, id }`

**POST /stop** — Detiene sesión
- Actualiza `ai_inference_sessions` con `status: 'stopped'`

**POST /end** — Calcula stats finales
- Mantiene la lógica actual de computar stats por fighter
- Guarda en `ai_fight_results` y actualiza `fights.ai_result`

Se mantienen los endpoints auxiliares: `/log`, `/health`, `/metrics`.

### 3. Mapping de columnas (fights → contrato)

| Contrato (Script)  | Base de datos real     |
|---------------------|------------------------|
| `red` fighter       | `fighter_a_id`         |
| `blue` fighter      | `fighter_b_id`         |
| `device_id`         | nueva columna          |
| `session_id`        | `ai_inference_sessions.id` |

### 4. Broadcast Realtime en /start

Al crear la sesión, emitir un broadcast al canal `fight_sync` con el payload `{ fight_id, status: "ACTIVE" }` para que el HUD y otros clientes se sincronicen automáticamente.

## Sin cambios en frontend

El frontend (HUD, VisionDiagnostics) no necesita cambios en esta fase — el contrato es para el Motor de Visión externo (Python).

## Archivos afectados

- `supabase/migrations/[new].sql` — agregar `device_id`, relajar NOT NULL
- `supabase/functions/ai-strike-ingest/index.ts` — reescribir con contrato oficial

