

# Test de evento AI + corrección de logo en HUD

## Hallazgos

1. **Logo incorrecto en HUD**: El HUD usa `/lovable-uploads/fighter-id-logo-white.png` hardcodeado, pero el resto de la app usa `useSystemAssets()` que resuelve al logo oficial `/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png`. Hay que unificar.

2. **Fight ID real disponible**: `238314f9-90f5-4d85-b7ae-cdf54b32f7e7` (fight_number: 1, status: scheduled).

3. **Tabla `ai_strike_events` confirmada** con columnas: fight_id (uuid), round_number (int), timestamp_ms (bigint), fighter (char), event_type (text), strike_type (text), confidence (numeric), model_version (text), metadata (jsonb).

## Plan de implementación

### 1. Insertar evento de prueba
Usar el insert tool para insertar un registro real en `ai_strike_events` con `fight_id = '238314f9-90f5-4d85-b7ae-cdf54b32f7e7'`:
```sql
INSERT INTO ai_strike_events (fight_id, round_number, timestamp_ms, fighter, event_type, strike_type, confidence, model_version)
VALUES ('238314f9-90f5-4d85-b7ae-cdf54b32f7e7', 1, 1741923600123, 'A', 'strike_connected', 'jab', 0.92, 'test-v1');
```

### 2. Corregir logo en HUD (`src/pages/HudPublicDisplay.tsx`)
- Reemplazar las 2 referencias hardcodeadas a `fighter-id-logo-white.png` por el logo oficial del sistema
- Importar `useSystemAssets` y usar `logoUrl` para mantener consistencia con el Header y el resto de la app
- Aplica en líneas 99 y 121

### Archivos a modificar
- `src/pages/HudPublicDisplay.tsx` — importar `useSystemAssets`, usar `logoUrl`

