import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  weightClass?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación primero
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado - falta token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Crear cliente de Supabase con el JWT del usuario
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Obtener usuario autenticado
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Error de autenticación:", authError);
      return new Response(
        JSON.stringify({ error: "No autorizado - usuario inválido" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verificar que sea admin usando RPC function
    console.log('Verificando admin para user:', user.id);
    const { data: isAdmin, error: isAdminError } = await supabaseClient.rpc('is_admin');
    
    if (isAdminError) {
      console.error('Error en is_admin RPC:', isAdminError);
      return new Response(
        JSON.stringify({ error: "Error verificando permisos de administrador" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('isAdmin resultado:', isAdmin);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden enviar invitaciones" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, firstName, lastName, phone, weightClass }: InvitationRequest = await req.json();

    // Generar token único
    const inviteToken = crypto.randomUUID();
    const registrationLink = `${Deno.env.get("SITE_URL") || "https://fighter-id.org"}/auth?invite=${inviteToken}`;

    console.log("Creating invitation for:", email);

    // Insertar invitación en la base de datos
    const { data: invitation, error: dbError } = await supabaseClient
      .from("fighter_invitations")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        weight_class: weightClass,
        token: inviteToken,
        invited_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creando invitación:", dbError);
      throw new Error(`Error creando invitación: ${dbError.message}`);
    }

    console.log("Invitation created:", invitation.id);

    // Enviar email con Resend con mejor manejo de errores y fallback
    const fromEnv = Deno.env.get("RESEND_FROM");
    let fromAddress = (fromEnv && fromEnv.trim() !== "") ? fromEnv : "Fighter ID <send@fighter-id.org>";

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🥊 Fighter ID</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">¡Hola ${firstName}!</h2>
                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                          Has sido invitado a registrarte en <strong>Fighter ID</strong>, la plataforma oficial para peleadores profesionales.
                        </p>
                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                          Haz clic en el botón de abajo para completar tu registro y crear tu perfil de peleador:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" style="margin: 0 auto;">
                          <tr>
                            <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                              <a href="${registrationLink}" 
                                 style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                                Completar Registro
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                          Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                        </p>
                        <p style="margin: 10px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                          ${registrationLink}
                        </p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eeeeee;">
                        
                        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                          Este enlace expirará en 7 días. Si no solicitaste esta invitación, puedes ignorar este email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
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

    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: "🥊 Invitación para registrarte en Fighter ID",
        html: htmlContent,
      });
    } catch (err: any) {
      console.error("Error enviando email con Resend (primario):", {
        name: err?.name,
        statusCode: err?.statusCode,
        message: err?.message,
        body: err?.body,
      });

      // Fallback si el dominio no está verificado
      const msg = `${err?.message || "Resend error"}`.toLowerCase();
      if (err?.statusCode === 403 || msg.includes("domain") || msg.includes("verify")) {
        try {
          fromAddress = "Fighter ID <onboarding@resend.dev>";
          emailResponse = await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: "🥊 Invitación para registrarte en Fighter ID",
            html: htmlContent,
          });
          console.log("Email enviado con remitente de fallback (onboarding@resend.dev)");
        } catch (fallbackErr: any) {
          console.error("Error también en fallback de Resend:", {
            name: fallbackErr?.name,
            statusCode: fallbackErr?.statusCode,
            message: fallbackErr?.message,
            body: fallbackErr?.body,
          });
          return new Response(
            JSON.stringify({
              error: "Fallo envío de email",
              details: fallbackErr?.message || fallbackErr,
            }),
            { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: err?.message || "Error enviando email" }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        registrationLink,
        fromUsed: fromAddress,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        registrationLink,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error en send-fighter-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
