

# Vision Engine Sync Status: Web ↔ Motor — ✅ COMPLETADO

## Cambios realizados

### 1. Migración SQL ✅
- Agregada columna `device_id text` a `fight_telemetry_sessions`
- Tabla ya tenía Realtime habilitado

### 2. Edge Function `ai-strike-ingest` v3.1 ✅
- **Nuevo endpoint `POST /heartbeat`**: Acepta `{ fight_id, device_id }`, upserta `fight_telemetry_sessions` con `status = 'connected'`, `last_heartbeat = now()`
- **`POST /start` actualizado**: Ahora también upserta `fight_telemetry_sessions` para bridge entre tablas
- **`POST /event` corregido**: `Math.round()` en `timestamp_ms` para evitar error bigint con floats
- **`POST /stop` y `/end`**: Marcan telemetry session como `disconnected`
- **Health version**: `3.1`

### 3. Frontend ✅
- **`useVisionEngineStatus(fightId)`**: Hook con suscripción Realtime + polling cada 3s, evalúa `isLive` con threshold de 10s
- **`VisionEngineIndicator`**: Badge compacto con punto verde/rojo animado + ícono Wifi
- **`EventDetail.tsx`**: Indicador integrado en cada fight card header

## Endpoints disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/start` | POST | Iniciar sesión + bridge telemetry |
| `/heartbeat` | POST | Heartbeat del motor (cada 3-5s) |
| `/event` | POST | Registrar golpe |
| `/stop` | POST | Detener sesión |
| `/end` | POST | Finalizar pelea + stats |
| `/log` | POST | Registrar log |
| `/health` | GET | Health check |
| `/metrics` | GET | Sesiones activas |
