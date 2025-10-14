# 📧 Sistema de Emails - Guía de Mejores Prácticas

## ⚠️ CRÍTICO: SIEMPRE USA `sendEmailWithFallback()`

**NUNCA** llames directamente a `resend.emails.send()`. Siempre usa la función compartida `sendEmailWithFallback()` que incluye:

- ✅ Validación automática de emails
- ✅ Retry logic con backoff exponencial  
- ✅ Logging seguro (sin exponer datos sensibles)
- ✅ Manejo de errores robusto
- ✅ Rate limiting básico

---

## 🚀 Cómo Crear una Nueva Función de Email

### 1. Importa las utilidades compartidas

```typescript
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback, EmailTemplates } from "../_shared/email-config.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
```

### 2. Usa sendEmailWithFallback para enviar emails

```typescript
try {
  await sendEmailWithFallback(resend, {
    to: userEmail,  // string o string[]
    subject: "Tu asunto aquí",
    html: EmailTemplates.wrap(tuContenidoHTML),
  });
  
  console.log("[TU_FUNCION] ✓ Email enviado exitosamente");
} catch (error) {
  console.error("[TU_FUNCION] ✗ Error al enviar email:", error.message);
  // Maneja el error apropiadamente
}
```

### 3. Usa los templates compartidos cuando sea posible

```typescript
const htmlContent = EmailTemplates.wrap(`
  <h2>Tu Título</h2>
  <p>Tu contenido aquí...</p>
`);
```

---

## 🛡️ Seguridad y Validación

### ✅ LO QUE SE HACE AUTOMÁTICAMENTE

La función `sendEmailWithFallback()` ya incluye:

- Validación de formato de email (RFC 5322)
- Límite de longitud de email (255 caracteres)
- Validación de subject y content
- Sanitización de emails en logs
- Rate limiting básico

### ⚠️ LO QUE DEBES HACER TÚ

1. **Validar datos de entrada del usuario ANTES de enviar**
   ```typescript
   if (!isValidInput(userData)) {
     throw new Error("Datos inválidos");
   }
   ```

2. **No incluir información sensible en subjects o logs**
   ```typescript
   // ❌ MAL
   console.log("Enviando a:", user.email, "contraseña:", user.password);
   
   // ✅ BIEN
   console.log("Enviando a:", sanitizeEmailForLog(user.email));
   ```

3. **Verificar autenticación antes de enviar emails**
   ```typescript
   const authHeader = req.headers.get("authorization");
   if (!authHeader) {
     throw new Error("No autorizado");
   }
   ```

---

## 📊 Logging Correcto

### ✅ Logging Seguro

```typescript
// Usa sanitizeEmailForLog para ocultar emails en logs
import { sanitizeEmailForLog } from "../_shared/email-config.ts";

console.log("[TU_FUNCION] Enviando a:", sanitizeEmailForLog(email));
// Output: "ca***@gmail.com"
```

### ❌ NUNCA hacer

```typescript
// ❌ NO LOGS DE DATOS SENSIBLES
console.log("Email completo:", email);  // MAL
console.log("Password:", password);      // MAL
console.log("Token completo:", token);   // MAL
```

---

## 🔄 Manejo de Errores

### Patrón Recomendado

```typescript
try {
  await sendEmailWithFallback(resend, emailData);
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: corsHeaders }
  );
  
} catch (error: any) {
  console.error("[TU_FUNCION] Error:", error.message);
  
  // NO revelar detalles internos al usuario
  return new Response(
    JSON.stringify({ 
      error: "Error al enviar el correo. Por favor intenta más tarde." 
    }),
    { status: 500, headers: corsHeaders }
  );
}
```

---

## 🧪 Testing de Funciones de Email

### 1. Test Mode en send-mass-email

```typescript
const testBody = {
  subject: "Test Email",
  html_content: "<h1>Test</h1>",
  test_mode: true,
  test_email: "tu-email@test.com"
};
```

### 2. Verifica en Resend Dashboard

- [Dashboard de Resend](https://resend.com/emails)
- Revisa logs de envío
- Verifica tasas de entrega
- Monitorea bounces y quejas

### 3. Revisa los Logs de Edge Functions

```bash
# Ver logs en Supabase
https://supabase.com/dashboard/project/[PROJECT_ID]/functions/[FUNCTION_NAME]/logs
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "Invalid email address"

**Causa:** Email no cumple RFC 5322 o supera 255 caracteres

**Solución:** Valida el email antes de enviar
```typescript
import { isValidEmail } from "../_shared/email-config.ts";

if (!isValidEmail(email)) {
  throw new Error("Email inválido");
}
```

### Error: "Failed to send email after X attempts"

**Causa:** Problema con Resend o dominio no verificado

**Solución:**
1. Verifica que el dominio esté verificado en Resend
2. Revisa que `RESEND_API_KEY` esté configurado
3. Revisa los logs de Resend para más detalles

### Error: "Too many recipients"

**Causa:** Intentando enviar a más de 100 emails a la vez

**Solución:** Usa batching en send-mass-email o divide en múltiples envíos

---

## 📋 Checklist Pre-Deploy

Antes de hacer deploy de una nueva función de email:

- [ ] Usa `sendEmailWithFallback()` (no `resend.emails.send()` directo)
- [ ] Validas datos de entrada del usuario
- [ ] Sanitizas emails en logs
- [ ] Manejas errores apropiadamente
- [ ] No revelas información sensible en logs
- [ ] Verificas autenticación cuando sea necesario
- [ ] Has probado en modo test
- [ ] El subject y content no están vacíos
- [ ] Usas CORS headers correctos

---

## 🔐 Variables de Entorno Requeridas

```bash
RESEND_API_KEY=re_xxxxx              # REQUERIDO
RESEND_FROM=notificaciones@fighter-id.org  # OPCIONAL (usa default)
```

---

## 📞 Soporte

Si encuentras problemas con el sistema de emails:

1. **Revisa los logs** en Supabase Edge Functions
2. **Verifica Resend Dashboard** para errores de entrega
3. **Revisa este documento** para mejores prácticas
4. **No modifiques `email-config.ts`** sin consultar primero

---

## 🎯 Ejemplos de Referencia

### Funciones que implementan correctamente estas prácticas:

1. `send-fighter-invitation/index.ts` - Invitaciones de peleadores
2. `send-license-approval/index.ts` - Aprobación de licencias  
3. `send-mass-email/index.ts` - Emails masivos con batching
4. `send-password-recovery/index.ts` - Recuperación de contraseña
5. `send-signup-confirmation/index.ts` - Confirmación de registro

**Revisa estas funciones** como referencia cuando crees nuevas funciones de email.

---

## 🚀 Roadmap Futuro

Mejoras planificadas para el sistema de emails:

- [ ] Templates React con React Email
- [ ] Queue system para emails masivos (Bull/BullMQ)
- [ ] Webhooks de Resend para tracking de entrega
- [ ] Métricas y analytics de emails
- [ ] A/B testing de templates
- [ ] Internacionalización (i18n) de emails

---

**Última actualización:** 2025-10-14
**Mantenedor:** Sistema de Fighter ID
**Versión:** 1.0.0
