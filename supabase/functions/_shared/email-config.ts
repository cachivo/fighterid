import { Resend } from "npm:resend@2.0.0";

/**
 * Get the formatted "from" email address for Resend
 * Uses RESEND_FROM environment variable with fallback to Resend's onboarding domain
 */
export function getEmailFrom(): string {
  const fromEmail = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";
  const fromName = "Fighter ID";
  
  // If email already includes name format, use as-is
  if (fromEmail.includes("<")) {
    return fromEmail;
  }
  
  // Otherwise, format with name
  return `${fromName} <${fromEmail}>`;
}

/**
 * Send email with automatic fallback to Resend onboarding domain
 * if custom domain is not verified
 */
export async function sendEmailWithFallback(
  resend: Resend,
  emailData: {
    to: string | string[];
    subject: string;
    html: string;
  }
) {
  try {
    console.log("[EMAIL] Attempting to send with configured domain");
    return await resend.emails.send({
      from: getEmailFrom(),
      to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });
  } catch (err: any) {
    // If domain verification fails, fallback to Resend's onboarding domain
    if (err?.statusCode === 403 || err?.message?.includes("domain") || err?.message?.includes("verified")) {
      console.log("[EMAIL] Domain not verified, falling back to onboarding@resend.dev");
      return await resend.emails.send({
        from: "Fighter ID <onboarding@resend.dev>",
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      });
    }
    throw err;
  }
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
