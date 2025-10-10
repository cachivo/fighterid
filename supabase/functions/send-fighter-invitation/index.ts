import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmailWithFallback, EmailTemplates } from "../_shared/email-config.ts";

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

    console.log("[INVITATION] Creating invitation for:", email);

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
      console.error("[INVITATION] Error creating invitation:", dbError);
      throw new Error(`Error creando invitación: ${dbError.message}`);
    }

    console.log("[INVITATION] Invitation created:", invitation.id);

    // Send invitation email using centralized email config
    const emailContent = `
      <h2>¡Hola ${firstName} ${lastName}!</h2>
      
      <p>Has sido invitado a unirte a Fighter ID, el sistema oficial de gestión de licencias para peleadores.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Detalles de tu invitación:</strong></p>
        <ul style="margin: 10px 0;">
          ${weightClass ? `<li>Categoría de Peso: <strong>${weightClass}</strong></li>` : ''}
          ${phone ? `<li>Teléfono de contacto: ${phone}</li>` : ''}
        </ul>
      </div>
      
      <p>Para completar tu registro y activar tu licencia, haz clic en el siguiente botón:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registrationLink}" class="button">
          Completar Registro
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${registrationLink}" style="color: #0066cc; word-break: break-all;">
          ${registrationLink}
        </a>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        <strong>Nota:</strong> Esta invitación expirará en 7 días.
      </p>
    `;

    try {
      const emailResult = await sendEmailWithFallback(resend, {
        to: email,
        subject: "🥊 Invitación para registrarte en Fighter ID",
        html: EmailTemplates.wrap(emailContent),
      });

      console.log("[INVITATION] Email sent successfully:", emailResult);
    } catch (emailError: any) {
      console.error("[INVITATION] Failed to send invitation email:", emailError);
      throw new Error(`Failed to send invitation email: ${emailError.message}`);
    }

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
