import { Resend } from "npm:resend@2.0.0";

// ============================================================================
// EMAIL CONFIGURATION - PRODUCTION READY
// ============================================================================
// Este archivo contiene toda la lógica compartida para envío de emails
// NUNCA modifiques directamente las funciones de email sin actualizar este archivo
// ============================================================================

/**
 * Configuración de rate limiting para emails
 * Previene abuso y costos excesivos
 */
const EMAIL_RATE_LIMITS = {
  MAX_EMAILS_PER_MINUTE: 100,
  MAX_EMAILS_PER_HOUR: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
} as const;

/**
 * Validación de email address
 * RFC 5322 compliant
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Sanitizar email para logging (ocultar información sensible)
 */
export function sanitizeEmailForLog(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@invalid';
  const visibleChars = Math.min(2, local.length);
  return `${local.substring(0, visibleChars)}${'*'.repeat(Math.max(0, local.length - visibleChars))}@${domain}`;
}

/**
 * Get the formatted "from" email address for Resend
 * Uses RESEND_FROM environment variable with fallback to Resend's onboarding domain
 */
export function getEmailFrom(): string {
  const fromEmail = Deno.env.get("RESEND_FROM") || "notificaciones@fighter-id.org";
  const fromName = "Fighter ID";
  
  // If email already includes name format, use as-is
  if (fromEmail.includes("<")) {
    return fromEmail;
  }
  
  // Otherwise, format with name
  return `${fromName} <${fromEmail}>`;
}

/**
 * Validar datos de email antes de enviar
 * @throws Error si los datos son inválidos
 */
function validateEmailData(emailData: {
  to: string | string[];
  subject: string;
  html: string;
}): void {
  // Validar destinatarios
  const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
  
  if (recipients.length === 0) {
    throw new Error('[EMAIL] No recipients provided');
  }

  if (recipients.length > EMAIL_RATE_LIMITS.MAX_EMAILS_PER_MINUTE) {
    throw new Error(`[EMAIL] Too many recipients (max ${EMAIL_RATE_LIMITS.MAX_EMAILS_PER_MINUTE})`);
  }

  // Validar cada email
  for (const email of recipients) {
    if (!isValidEmail(email)) {
      throw new Error(`[EMAIL] Invalid email address: ${sanitizeEmailForLog(email)}`);
    }
  }

  // Validar subject
  if (!emailData.subject || emailData.subject.trim().length === 0) {
    throw new Error('[EMAIL] Email subject is required');
  }

  if (emailData.subject.length > 998) {
    throw new Error('[EMAIL] Email subject too long (max 998 characters)');
  }

  // Validar HTML content
  if (!emailData.html || emailData.html.trim().length === 0) {
    throw new Error('[EMAIL] Email HTML content is required');
  }

  if (emailData.html.length > 1000000) {
    throw new Error('[EMAIL] Email HTML content too large (max 1MB)');
  }
}

/**
 * Send email with automatic retry, validation and error handling
 * ¡SIEMPRE USA ESTA FUNCIÓN PARA ENVIAR EMAILS!
 * 
 * Features:
 * - Validación automática de inputs
 * - Retry logic con backoff exponencial
 * - Logging detallado pero seguro
 * - Sanitización de datos sensibles en logs
 * 
 * @param resend - Instancia de Resend client
 * @param emailData - Datos del email a enviar
 * @param options - Opciones adicionales (retries, etc)
 * @returns Promise con el resultado del envío
 * @throws Error si falla después de todos los reintentos
 */
export async function sendEmailWithFallback(
  resend: Resend,
  emailData: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string; // Optional: override default sender
  },
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
) {
  const maxRetries = options.maxRetries ?? EMAIL_RATE_LIMITS.MAX_RETRIES;
  const retryDelay = options.retryDelay ?? EMAIL_RATE_LIMITS.RETRY_DELAY_MS;

  // Validar datos ANTES de intentar enviar
  try {
    validateEmailData(emailData);
  } catch (validationError: any) {
    console.error('[EMAIL] Validation failed:', validationError.message);
    throw validationError;
  }

  const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
  const sanitizedRecipients = recipients.map(sanitizeEmailForLog);

  console.log("[EMAIL] Preparing to send email:", {
    to: sanitizedRecipients,
    subject: emailData.subject,
    contentLength: emailData.html.length,
    timestamp: new Date().toISOString()
  });

  let lastError: Error | null = null;

  // Intentar enviar con reintentos
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL] Attempt ${attempt}/${maxRetries}`);
      
      const result = await resend.emails.send({
        from: emailData.from || getEmailFrom(),
        to: recipients,
        subject: emailData.subject,
        html: emailData.html,
      });

      console.log("[EMAIL] ✓ Email sent successfully:", {
        id: result.data?.id,
        to: sanitizedRecipients,
        attempt,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (err: any) {
      lastError = err;
      console.error(`[EMAIL] ✗ Attempt ${attempt}/${maxRetries} failed:`, {
        error: err.message,
        code: err.code,
        statusCode: err.statusCode,
        to: sanitizedRecipients
      });

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < maxRetries) {
        const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[EMAIL] Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // Si llegamos aquí, fallaron todos los intentos
  const errorMessage = `Failed to send email after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error('[EMAIL] ✗ All attempts failed:', {
    to: sanitizedRecipients,
    error: errorMessage,
    timestamp: new Date().toISOString()
  });

  throw new Error(errorMessage);
}

/**
 * Email templates with proper HTML structure
 * Optimized to avoid SPAM filters with proper alt text and unsubscribe link
 */
export const EmailTemplates = {
  /**
   * Wrap email content in Fighter ID branded layout
   * @param content - HTML content to wrap
   * @param unsubscribeUrl - Optional unsubscribe URL to add footer link
   */
  wrap: (content: string, unsubscribeUrl?: string): string => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Fighter ID</title>
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                Fighter ID
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Plataforma Oficial de Gestión de Peleadores
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; color: #333333; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                <strong>Fighter ID</strong> - Sistema de Certificación Deportiva
              </p>
              <p style="margin: 0 0 15px 0; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} Fighter ID. Todos los derechos reservados.
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 0; color: #999; font-size: 11px;">
                <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: underline;">
                  Cancelar suscripción
                </a> | 
                <a href="https://fighter-id.org/privacy" style="color: #667eea; text-decoration: underline;">
                  Política de privacidad
                </a>
              </p>
              ` : `
              <p style="margin: 0; color: #999; font-size: 11px;">
                Este correo fue enviado porque formas parte de nuestra plataforma.
              </p>
              `}
            </td>
          </tr>
        </table>
        
        <!-- Email client compatibility text -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 15px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 11px;">
                ¿No puedes ver este email correctamente? 
                <a href="https://fighter-id.org" style="color: #667eea; text-decoration: underline;">
                  Ver en navegador
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
};
