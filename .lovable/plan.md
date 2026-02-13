
# Flujo "Email-First" — IMPLEMENTADO ✅

## Cambios realizados

1. **Edge Function `check-email-exists`** — Creada y desplegada
   - Verifica si un email existe en `auth.users` via RPC `check_email_exists_fn`
   - Rate limiting por IP (10 req/min)
   - `verify_jwt = false` en config.toml

2. **RPC `check_email_exists_fn`** — Creada via migración
   - `SECURITY DEFINER` con `SET search_path = ''`
   - Consulta `auth.users` de forma segura

3. **`src/pages/license/LicenseAuth.tsx`** — Reescrito con flujo email-first
   - Paso 1: Solo email + "Continuar"
   - Paso 2A (existe): Password + login + forgot password
   - Paso 2B (no existe): Registro completo (nombre, apellido, password, fecha, país, avatar)
   - Botón "Usar otro email" para volver

4. **`src/pages/Auth.tsx`** — Reescrito con flujo email-first
   - Mismo patrón de 3 pasos
   - Mantiene lógica de invitaciones
   - Mantiene redirect a admin
