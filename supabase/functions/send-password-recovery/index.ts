import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

interface RecoveryRequest {
  email: string;
  redirectTo?: string;
}

// Intelligent rate limiting
function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitStore.set(key, { attempts: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes
    return { allowed: true };
  }

  if (record.attempts >= 3) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.attempts++;
  return { allowed: true };
}

// Professional email template
function getRecoveryEmailHTML(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu acceso a Fighter ID</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                🥊 Fighter ID
              </h1>
              <p style="margin: 10px 0 0; color: #e0e0e0; font-size: 14px;">
                Sistema de Licencias Deportivas
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                Recupera tu acceso
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Fighter ID.
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0 0 30px; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-size: 13px; color: #4b5563;">
                ${resetLink}
              </p>
              
              <!-- Security info -->
              <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⏱️ Este enlace es válido por 1 hora.</strong><br>
                  Por seguridad, el enlace expirará después de ese tiempo.
                </p>
              </div>
              
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña permanecerá sin cambios.
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Nota:</strong> Si tienes problemas para acceder, revisa tu carpeta de spam o contacta a nuestro equipo de soporte.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@fighter-id.org" style="color: #dc2626; text-decoration: none;">soporte@fighter-id.org</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © 2025 Fighter ID. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: RecoveryRequest = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log("[RECOVERY] Invalid email format:", { email, ip: clientIp });
      // Always return success to prevent user enumeration
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting by IP + email combination
    const rateLimitKey = `${clientIp}:${email.toLowerCase()}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey);

    if (!rateLimitCheck.allowed) {
      console.log("[RECOVERY] Rate limit exceeded:", { email, ip: clientIp, retryAfter: rateLimitCheck.retryAfter });
      return new Response(
        JSON.stringify({ 
          error: "Demasiados intentos. Por favor, espera antes de intentar nuevamente.",
          retryAfter: rateLimitCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "300"
          } 
        }
      );
    }

    console.log("[RECOVERY] Request received:", { 
      email: email.replace(/(?<=.{2}).(?=.*@)/g, '*'), 
      ip: clientIp,
      timestamp: new Date().toISOString()
    });

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists (using admin client)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userError || !userData.user) {
      console.log("[RECOVERY] User not found:", { email: email.replace(/(?<=.{2}).(?=.*@)/g, '*') });
      // IMPORTANT: Always return success to prevent user enumeration
      // Add artificial delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate password recovery link
    const defaultRedirect = redirectTo || `${Deno.env.get("SITE_URL") || "https://fighter-id.org"}/auth/reset-password`;
    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: defaultRedirect
      }
    });

    if (recoveryError || !recoveryData) {
      console.error("[RECOVERY] Error generating recovery link:", recoveryError);
      throw new Error("Error al generar el enlace de recuperación");
    }

    const resetLink = recoveryData.properties.action_link;

    // Send email with Resend
    const emailResult = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM") || "Fighter ID <send@fighter-id.org>",
      to: [email],
      subject: "Recupera tu acceso a Fighter ID",
      html: getRecoveryEmailHTML(resetLink),
    });

    if (emailResult.error) {
      console.error("[RECOVERY] Error sending email:", emailResult.error);
      throw new Error("Error al enviar el correo");
    }

    console.log("[RECOVERY] Email sent successfully:", { 
      email: email.replace(/(?<=.{2}).(?=.*@)/g, '*'),
      emailId: emailResult.data?.id,
      timestamp: new Date().toISOString()
    });

    // Always return generic success message
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[RECOVERY] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Generic error response to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: "Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
