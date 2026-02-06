
# Plan: Optimización del Flujo de Registro de Fighter ID

## ✅ IMPLEMENTADO

---

## Cambios Realizados

### 1. ✅ Edge Function de Confirmación
**Archivo:** `supabase/functions/send-signup-confirmation/index.ts`
- Cambiado `redirectTo` default de `/license/auth` a `/license/onboarding`

### 2. ✅ Callback de Autenticación
**Archivo:** `src/pages/AuthCallback.tsx`
- Implementada función `determineUserDestination()` para routing inteligente
- Verifica: app_user → fighter_profiles → fighter_licenses → status
- Rutas según estado: ACTIVE → dashboard, PENDING_REVIEW → pending, etc.

### 3. ✅ Hook de Autenticación Principal
**Archivo:** `src/hooks/useAuth.tsx`
- `emailRedirectTo` cambiado a `/license/onboarding`

### 4. ✅ Página de Login de Licencias
**Archivo:** `src/pages/license/LicenseAuth.tsx`
- Redirección inteligente post-login basada en estado del perfil
- Ya no redirige a `/` sino al destino apropiado

---

## Flujo Corregido

```text
Usuario se registra
       ↓
Recibe email de confirmación  
       ↓
Hace clic en "Confirmar mi cuenta"
       ↓
→ Llega DIRECTO a /license/onboarding  ✅
       ↓
Comienza a llenar su perfil inmediatamente
```

---

## Verificación DNS Recomendada (Para Spam)

Para mejorar entrega de correos, verificar en el proveedor de dominio:

```text
SPF:   v=spf1 include:_spf.resend.com ~all
DKIM:  Configurado en Resend Dashboard
DMARC: v=DMARC1; p=none; rua=mailto:admin@fighter-id.org
```
