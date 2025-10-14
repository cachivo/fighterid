import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { sendEmailWithFallback } from "../_shared/email-config.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MassEmailRequest {
  subject: string;
  html_content: string;
  recipient_filter?: 'all' | 'fighters_only' | 'admins_only' | 'custom';
  custom_emails?: string[];
  test_mode?: boolean; // Si es true, solo envía a un correo de prueba
  test_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[MASS EMAIL] Request received");

    // Verificar autenticación y que sea admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Crear cliente con el token del usuario para verificar autenticación
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    // Verificar token y obtener usuario
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[MASS EMAIL] Auth error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("[MASS EMAIL] User authenticated:", user.id);

    // Verificar que el usuario sea admin
    const { data: isAdminResult, error: adminError } = await supabaseAuth
      .rpc('is_admin');

    console.log("[MASS EMAIL] Admin check result:", { isAdminResult, adminError });

    if (adminError || !isAdminResult) {
      console.error("[MASS EMAIL] Admin check failed:", adminError);
      throw new Error("Only admins can send mass emails");
    }

    // Crear cliente con service role para operaciones privilegiadas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: MassEmailRequest = await req.json();
    console.log("[MASS EMAIL] Request data:", {
      subject: requestData.subject,
      filter: requestData.recipient_filter,
      test_mode: requestData.test_mode
    });

    // Validar datos requeridos
    if (!requestData.subject || !requestData.html_content) {
      throw new Error("Subject and html_content are required");
    }

    let recipients: string[] = [];

    // Modo de prueba
    if (requestData.test_mode && requestData.test_email) {
      recipients = [requestData.test_email];
      console.log("[MASS EMAIL] Test mode - sending to:", requestData.test_email);
    } else if (requestData.recipient_filter === 'custom' && requestData.custom_emails) {
      recipients = requestData.custom_emails;
      console.log("[MASS EMAIL] Custom recipients:", recipients.length);
    } else {
      // Obtener destinatarios de la base de datos
      let query = supabase.from('app_user').select('email');

      switch (requestData.recipient_filter) {
        case 'fighters_only':
          // Usuarios que tienen perfil de peleador activo
          query = supabase
            .from('app_user')
            .select('email, fighter_profiles!inner(active)')
            .eq('fighter_profiles.active', true);
          break;
        
        case 'admins_only':
          query = query.eq('is_admin', true);
          break;
        
        case 'all':
        default:
          // Todos los usuarios
          break;
      }

      const { data: users, error: usersError } = await query;

      if (usersError) {
        throw new Error(`Error fetching recipients: ${usersError.message}`);
      }

      recipients = users
        ?.map(u => u.email)
        .filter((email): email is string => !!email) || [];

      console.log("[MASS EMAIL] Recipients found:", recipients.length);
    }

    if (recipients.length === 0) {
      throw new Error("No recipients found");
    }

    // Resend tiene un límite de envíos por batch, así que dividimos en lotes
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    console.log("[MASS EMAIL] Sending in", batches.length, "batches");

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Enviar cada batch
    for (const batch of batches) {
      try {
        // Enviar correos individuales para mejor control de errores
        const batchPromises = batch.map(email => 
          sendEmailWithFallback(resend, {
            to: email,
            subject: requestData.subject,
            html: requestData.html_content,
          }).catch(error => ({
            error: true,
            email,
            message: error.message
          }))
        );

        const batchResults = await Promise.all(batchPromises);

        // Contar resultados
        batchResults.forEach((result: any) => {
          if (result.error) {
            results.failed++;
            results.errors.push(result);
          } else {
            results.success++;
          }
        });

        // Pequeña pausa entre batches para no sobrecargar
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError: any) {
        console.error("[MASS EMAIL] Batch error:", batchError);
        results.failed += batch.length;
        results.errors.push({
          batch: true,
          message: batchError.message
        });
      }
    }

    console.log("[MASS EMAIL] Results:", results);

    // Registrar en log de auditoría
    await supabase.from('email_campaign_log').insert({
      sent_by: user.id,
      subject: requestData.subject,
      recipient_filter: requestData.recipient_filter || 'all',
      total_sent: results.success,
      total_failed: results.failed,
      test_mode: requestData.test_mode || false
    });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Emails sent successfully. Success: ${results.success}, Failed: ${results.failed}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[MASS EMAIL] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
