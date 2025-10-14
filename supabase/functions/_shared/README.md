# 📚 Carpeta Compartida de Edge Functions

Esta carpeta contiene código y configuraciones **compartidas** entre todas las Edge Functions del proyecto Fighter ID.

## 🎯 Propósito

Centralizar código común para:
- ✅ Evitar duplicación de código
- ✅ Mantener consistencia entre funciones
- ✅ Facilitar actualizaciones y mantenimiento
- ✅ Aplicar mejores prácticas automáticamente

---

## 📁 Estructura

```
_shared/
├── README.md                    # Este archivo
├── EMAIL_BEST_PRACTICES.md      # Guía completa de emails
└── email-config.ts              # Configuración y utilidades de email
```

---

## 🔧 Archivos Disponibles

### `email-config.ts`

**Funciones exportadas:**

```typescript
// Enviar email con retry y validación automática
sendEmailWithFallback(
  resend: Resend,
  emailData: { to, subject, html },
  options?: { maxRetries, retryDelay }
): Promise<EmailResult>

// Obtener remitente formateado
getEmailFrom(): string

// Validar formato de email
isValidEmail(email: string): boolean

// Sanitizar email para logs
sanitizeEmailForLog(email: string): string

// Templates HTML compartidos
EmailTemplates.wrap(content: string): string
```

**Características:**

- ✅ Validación automática de emails (RFC 5322)
- ✅ Retry logic con backoff exponencial (3 intentos)
- ✅ Logging detallado y seguro
- ✅ Rate limiting básico
- ✅ Manejo de errores robusto

---

## 🚀 Cómo Usar

### Ejemplo Básico

```typescript
// En tu edge function
import { sendEmailWithFallback, EmailTemplates } from "../_shared/email-config.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Enviar email con protección completa
await sendEmailWithFallback(resend, {
  to: "usuario@ejemplo.com",
  subject: "Bienvenido a Fighter ID",
  html: EmailTemplates.wrap(`
    <h2>¡Hola!</h2>
    <p>Bienvenido a nuestra plataforma.</p>
  `),
});
```

### Ejemplo Avanzado (con opciones)

```typescript
await sendEmailWithFallback(
  resend,
  {
    to: ["usuario1@test.com", "usuario2@test.com"],
    subject: "Notificación Importante",
    html: miHTMLPersonalizado,
  },
  {
    maxRetries: 5,      // Más reintentos
    retryDelay: 3000,   // 3 segundos entre reintentos
  }
);
```

---

## ⚠️ REGLAS CRÍTICAS

### 🚫 NUNCA Hacer

1. **NO uses `resend.emails.send()` directamente**
   ```typescript
   // ❌ MAL - Sin protección
   await resend.emails.send({ to, subject, html });
   
   // ✅ BIEN - Con protección
   await sendEmailWithFallback(resend, { to, subject, html });
   ```

2. **NO modifiques `email-config.ts` sin revisar impacto**
   - Este archivo es usado por TODAS las funciones de email
   - Cualquier cambio puede afectar múltiples funciones
   - Siempre prueba en ambiente de desarrollo primero

3. **NO expongas emails completos en logs**
   ```typescript
   // ❌ MAL
   console.log("Email:", user.email);
   
   // ✅ BIEN
   console.log("Email:", sanitizeEmailForLog(user.email));
   ```

### ✅ SIEMPRE Hacer

1. **USA las funciones compartidas**
   - Mantiene consistencia
   - Aplica mejores prácticas automáticamente
   - Facilita debugging

2. **VALIDA datos antes de enviar**
   ```typescript
   if (!isValidEmail(email)) {
     throw new Error("Email inválido");
   }
   ```

3. **MANEJA errores apropiadamente**
   ```typescript
   try {
     await sendEmailWithFallback(resend, emailData);
   } catch (error) {
     console.error("[MI_FUNCION] Error:", error.message);
     // Retorna error genérico al usuario
   }
   ```

---

## 📝 Agregar Nuevas Utilidades Compartidas

Si necesitas agregar nuevo código compartido:

### 1. Evalúa si es realmente compartido

**Pregúntate:**
- ¿Lo usarán 2+ funciones diferentes?
- ¿Necesita ser consistente entre funciones?
- ¿Simplifica mantenimiento futuro?

Si respuestas "sí" → Agregar a `_shared`
Si respondes "no" → Dejar en función específica

### 2. Crea el archivo apropiado

```
_shared/
├── email-config.ts      # Ya existe - utilidades de email
├── auth-helpers.ts      # Nuevo - autenticación compartida
├── validation.ts        # Nuevo - validaciones comunes
└── constants.ts         # Nuevo - constantes del proyecto
```

### 3. Documenta en este README

Agrega sección con:
- Propósito del archivo
- Funciones exportadas
- Ejemplos de uso
- Consideraciones especiales

### 4. Actualiza funciones existentes

Si el nuevo código reemplaza lógica duplicada:
- Identifica funciones afectadas
- Actualiza imports
- Prueba exhaustivamente
- Documenta cambios

---

## 🧪 Testing

### Test de Funciones Compartidas

```typescript
// Prueba básica de validación
import { isValidEmail, sanitizeEmailForLog } from "../_shared/email-config.ts";

console.assert(isValidEmail("test@example.com") === true);
console.assert(isValidEmail("invalid") === false);
console.assert(sanitizeEmailForLog("usuario@test.com") === "us****@test.com");
```

### Test de sendEmailWithFallback

Usa `send-mass-email` con `test_mode`:

```bash
curl -X POST 'https://[PROJECT_ID].supabase.co/functions/v1/send-mass-email' \
  -H 'Authorization: Bearer [TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{
    "subject": "Test",
    "html_content": "<h1>Test</h1>",
    "test_mode": true,
    "test_email": "tu-email@test.com"
  }'
```

---

## 📊 Monitoreo

### Logs de Edge Functions

Ver logs en tiempo real:
```
https://supabase.com/dashboard/project/[PROJECT_ID]/functions/[FUNCTION_NAME]/logs
```

### Métricas de Email

Ver en Resend Dashboard:
```
https://resend.com/emails
```

**Métricas importantes:**
- Tasa de entrega
- Bounces (rebotes)
- Quejas de spam
- Tiempo de entrega

---

## 🔄 Versioning y Cambios

### Historial de Cambios Importantes

**v1.0.0 (2025-10-14)**
- ✅ Sistema de emails robusto con retry logic
- ✅ Validación automática de inputs
- ✅ Logging seguro y sanitizado
- ✅ Rate limiting básico
- ✅ Documentación completa

### Hacer Cambios Seguros

1. **Branch/Fork del código**
2. **Modificar archivo compartido**
3. **Identificar funciones afectadas**
4. **Probar TODAS las funciones afectadas**
5. **Documentar cambios**
6. **Deploy gradual (si es posible)**
7. **Monitorear logs post-deploy**

---

## 🆘 Troubleshooting

### Problema: "Module not found"

```typescript
// ❌ MAL - Path incorrecto
import { sendEmail } from "../email-config.ts";

// ✅ BIEN - Path correcto
import { sendEmailWithFallback } from "../_shared/email-config.ts";
```

### Problema: "sendEmailWithFallback is not a function"

**Posibles causas:**
1. Import incorrecto
2. Archivo `email-config.ts` modificado incorrectamente
3. Cache de Deno no actualizado

**Solución:**
- Verifica imports
- Revisa exports en `email-config.ts`
- Espera a que Supabase redeploy la función

### Problema: "Email validation failed"

**Causa:** Email no cumple RFC 5322

**Solución:**
```typescript
import { isValidEmail } from "../_shared/email-config.ts";

if (!isValidEmail(email)) {
  throw new Error(`Email inválido: ${email}`);
}
```

---

## 🔗 Enlaces Útiles

- [Guía de Mejores Prácticas de Email](./EMAIL_BEST_PRACTICES.md)
- [Documentación de Resend](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://docs.deno.com/deploy/manual)

---

## 📞 Soporte

**Problemas con código compartido:**
1. Revisa este README
2. Revisa documentación específica (ej: EMAIL_BEST_PRACTICES.md)
3. Revisa logs en Supabase Dashboard
4. Revisa código de funciones de referencia

**Antes de modificar código compartido:**
- ⚠️ Entiende el impacto en todas las funciones
- ⚠️ Prueba exhaustivamente
- ⚠️ Documenta cambios
- ⚠️ Considera backwards compatibility

---

**Mantenedor:** Equipo Fighter ID
**Última actualización:** 2025-10-14
**Versión:** 1.0.0
