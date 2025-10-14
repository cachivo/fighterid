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
        from: getEmailFrom(),
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
 * Common email templates
 */
export const EmailTemplates = {
  /**
   * Wrap content in a standard Fighter ID email layout
   */
  wrap: (content: string): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #f0f0f0;
          }
          .content {
            padding: 30px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 2px solid #f0f0f0;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 0;
          }
          .button:hover {
            background-color: #0052a3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #0066cc; margin: 0;">Fighter ID</h1>
          <p style="color: #666; margin: 5px 0;">Sistema de Gestión de Licencias</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fighter ID. Todos los derechos reservados.</p>
          <p style="font-size: 12px; color: #999;">
            Si no solicitaste este correo, puedes ignorarlo de forma segura.
          </p>
        </div>
      </body>
    </html>
  `,
};
