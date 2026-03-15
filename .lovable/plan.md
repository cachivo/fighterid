

# Integración Fighter ID Vision Motor — Plan de Implementación

El documento describe la integración del motor de IA de detección de golpes con la web app. Los 4 archivos mencionados no fueron subidos junto al documento, así que los generaré basándome en las especificaciones y el código existente del proyecto.

## Qué se implementará

### 1. Migración SQL: tabla `ai_fight_results`
- Crear tabla `ai_fight_results` con campos para stats finales por pelea (golpes, precisión, tipos de golpe por peleador)
- Agregar columnas `ai_result` (JSONB) en la tabla `fights` para enlazar resultados del motor
- Usar `IF NOT EXISTS` para idempotencia
- RLS: lectura pública, escritura solo desde service_role (Edge Function)

### 2. Edge Function actualizada: `/fight/end`
- Agregar endpoint `POST /fight/end` al `ai-strike-ingest/index.ts` existente
- El endpoint calcula stats finales desde `ai_strike_events`, guarda en `ai_fight_results`, y actualiza `fights.ai_result`
- Los endpoints existentes (`/event`, `/session/start`, `/session/stop`, `/log`, `/health`, `/metrics`) no cambian
- Actualizar health check a version `2.0`

### 3. Nuevo HUD público (`HudPublicDisplay.tsx`)
- Reemplazar el HUD actual que lee de `scoring_events` (jueces manuales) por uno que lee de `ai_strike_events` (motor de visión)
- Mostrar: nombre del peleador, golpes intentados/conectados, precisión, tipos de golpe, actividad reciente
- Realtime via Supabase channel en `ai_strike_events`
- Countdown del round configurable
- Diseño fullscreen para proyección en venue (sin navegación)

### 4. Widget `LiveFightStatsWidget.tsx` + integración en `EnVivo.tsx`
- Componente compacto que muestra stats en vivo bajo el stream de video
- Usa `useAIStrikeEvents` (hook existente, no se modifica)
- Se renderiza condicionalmente en `EnVivo.tsx` solo cuando hay `fight_id` en el meta del evento
- Si no hay fight_id activo, no se renderiza

## Archivos a modificar/crear
- **Crear**: migración SQL para `ai_fight_results`
- **Editar**: `supabase/functions/ai-strike-ingest/index.ts` (agregar `/fight/end`)
- **Reemplazar**: `src/pages/HudPublicDisplay.tsx`
- **Crear**: `src/components/LiveFightStatsWidget.tsx`
- **Editar**: `src/pages/EnVivo.tsx` (agregar widget)

## Detalles técnicos
- El hook `useAIStrikeEvents` ya existe y no se toca
- La URL del HUD sigue siendo `/hud/fight/:fightId` (ruta ya registrada en App.tsx)
- El widget usa la misma conexión Realtime del proyecto
- La Edge Function usa `service_role` para bypass de RLS (ya configurado)

