

# Auditoria Completa del Sistema Fighter ID

## Resumen Ejecutivo

El sistema tiene **157 usuarios** en `app_user`, de los cuales **12 son huerfanos** (eliminados de `auth.users` pero presentes en `app_user`). El flujo de autenticacion, registro y onboarding tiene varios componentes funcionales, pero se identificaron problemas criticos de sincronizacion y flujos inactivos/rotos.

---

## Arquitectura del Flujo de Usuario

```text
[Email] --> check_email_exists_fn --> [Existe?]
   |                                     |
   |-- NO --> Registro (signUp) --> Trigger handle_new_user --> app_user
   |               |
   |               +--> Confirmacion Email --> /auth/callback --> /license/onboarding
   |                                               |
   |                                               +--> create_fighter_profile_with_license (RPC)
   |                                                        |
   |                                                        +--> fighter_profiles + fighter_licenses (PENDING_REVIEW)
   |
   |-- SI --> Login (signIn) --> Smart Routing
                                    |
                                    +-- No profile --> /license/onboarding
                                    +-- Pending license --> /license/pending
                                    +-- Active license --> /license/dashboard
                                    +-- Suspended --> /license/suspended
```

---

## Estado Actual de Cada Componente

### 1. Verificacion de Email (`check_email_exists_fn`) - CORREGIDO
- Verifica en `auth.users` Y `app_user`
- Estado: Funcionando correctamente tras la migracion reciente

### 2. Registro (Trigger `handle_new_user`) - FUNCIONAL
- Se ejecuta al insertar en `auth.users`
- Crea registro en `app_user` con datos basicos
- No crea `fighter_profiles` (correcto, eso se hace en onboarding)

### 3. Forgot Password (Auth general: `/auth/forgot-password`) - FUNCIONAL
- Usa `useAuth().resetPassword()` que invoca edge function `send-password-recovery`
- Edge function usa Resend + SITE_URL para generar enlace
- Redirige a `/auth/reset-password`
- **Secrets necesarios configurados**: RESEND_API_KEY, SITE_URL - OK

### 4. Forgot Password (License: `/license/forgot-password`) - FUNCIONAL
- Usa `useLicenseAuth().resetPassword()` - misma edge function
- Redirige a `/license/reset-password`

### 5. Reset Password (`/auth/reset-password`) - FUNCIONAL CON OBSERVACIONES
- Procesa tokens de recuperacion (hash, code, token_hash)
- Timeout de 12 segundos para verificacion
- Muestra formulario si hay sesion activa
- Muestra opciones de recuperacion si no hay sesion

### 6. Onboarding (`/license/onboarding`) - FUNCIONAL
- Usa `create_fighter_profile_with_license` (RPC atomica)
- Crea: app_user (si no existe) + fighter_profiles + fighter_licenses
- Sube documentos en background
- Guarda borrador en localStorage

### 7. Smart Routing (`AuthCallback.tsx` y `LicenseAuth.tsx`) - FUNCIONAL
- Determina destino basado en estado del perfil/licencia
- Cadena: auth.users -> app_user -> fighter_profiles -> fighter_licenses

---

## Problemas Identificados

### CRITICO: 12 Registros Huerfanos en app_user
Usuarios eliminados de `auth.users` pero que persisten en `app_user`. Esto causa:
- `check_email_exists_fn` retorna `true` (correcto tras fix)
- El usuario ve paso de "login" pero no puede autenticarse (no existe en auth.users)
- No hay forma de que el usuario se re-registre ni inicie sesion

**Emails afectados:**
- jmelendez@outlook.com
- uclesjimmy801@gmail.com
- soyharperlin@gmail.com
- jmelendezm@outlook.com
- wyang@liopametales.com
- nayelifonsecasanchez@gmail.com
- jimmyucles801@gmail.com
- sofiaordo2007@icloud.com
- enox01aldo@gamil.com
- jonalysh09@gmail.com
- miocorreo88@gmail.com
- josuepokemon255@gmail.com

### MEDIO: Restriccion UNIQUE duplicada en app_user.email
Existen dos constraints UNIQUE para email: `app_user_email_key` y `app_user_email_unique`. No causa errores pero es redundante.

### MEDIO: Usuarios "atascados" sin fighter_profiles
De los 157 app_user, muchos no tienen fighter_profiles (registraron pero no completaron onboarding). No hay un mecanismo para re-engancharlos o recordarles completar el proceso.

### BAJO: Uso de `window.location.href` en useLicenseAuth
En lineas 101-102, 111-112, 119-120 de `useLicenseAuth.tsx`, se usa `window.location.href` para redirigir. Esto recarga la pagina completa y pierde estado. Deberia usar `navigate()` (ya disponible en el hook).

---

## Plan de Correccion

### Paso 1: Limpiar registros huerfanos
Ejecutar migracion SQL para eliminar los 12 registros en `app_user` que no tienen usuario correspondiente en `auth.users`. Esto permitira que esos emails se puedan re-registrar.

```sql
DELETE FROM public.app_user 
WHERE auth_user_id NOT IN (SELECT id FROM auth.users);
```

### Paso 2: Eliminar constraint UNIQUE duplicado
```sql
ALTER TABLE public.app_user DROP CONSTRAINT IF EXISTS app_user_email_unique;
```
(Mantener `app_user_email_key` que es el original)

### Paso 3: Reemplazar `window.location.href` por `navigate()` en useLicenseAuth
En las lineas donde se hace redireccion forzada (101, 111, 119, 143, 263, 431), cambiar a `navigate(ruta, { replace: true })` para mantener el estado de la SPA.

### Paso 4: Agregar validacion defensiva en el flujo de login
Cuando `check_email_exists_fn` retorna `true` pero el usuario falla al autenticarse, mostrar un mensaje que sugiera contactar soporte o intentar registrarse con otro email, en caso de que sea un registro huerfano.

---

## Seccion Tecnica Detallada

### Archivos a Modificar

1. **Migracion SQL** (nueva):
   - Limpieza de huerfanos
   - Eliminar constraint duplicado

2. **`src/hooks/useLicenseAuth.tsx`** (lineas 101-102, 111-112, 119-120, 143-145, 263-264, 431-432):
   - Reemplazar `window.location.href = '/ruta'` por `navigate('/ruta', { replace: true })`

3. **`src/pages/Auth.tsx`** (manejo de error en login):
   - En `handleSignIn`, si el error es "Invalid login credentials", agregar sugerencia de recuperacion

### Tablas Involucradas
- `auth.users` (Supabase Auth, solo lectura)
- `public.app_user` (tabla principal de usuarios)
- `public.fighter_profiles` (perfiles de peleadores)
- `public.fighter_licenses` (licencias)
- `public.user_roles` (roles admin/moderator)

### Edge Functions Involucradas
- `check-email-exists` - Verificacion de email
- `send-password-recovery` - Envio de correo de recuperacion (usa Resend)
- `send-signup-confirmation` - Confirmacion de registro

### Funciones RPC Involucradas
- `check_email_exists_fn` - Verifica email en auth.users + app_user
- `handle_new_user` - Trigger que crea app_user al registrar
- `create_fighter_profile_with_license` - Onboarding atomico
- `check_user_license_status` - Estado de licencia optimizado

