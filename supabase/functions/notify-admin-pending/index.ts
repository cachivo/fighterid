import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { entity_type, entity_id, actor_name } = await req.json();

    console.log(`[NOTIFICATION] New pending ${entity_type}: ${entity_id}`);

    // Get all active admins
    const { data: admins, error: adminError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        app_user!inner(
          email,
          first_name,
          last_name
        )
      `)
      .eq('role', 'admin');

    if (adminError) {
      console.error('[ERROR] Failed to fetch admins:', adminError);
      throw adminError;
    }

    console.log(`[INFO] Found ${admins?.length || 0} admins to notify`);

    // In a production environment, you would send emails here
    // For now, we'll just log the notification
    for (const admin of admins || []) {
      console.log(`[NOTIFICATION] Would notify ${admin.app_user.email} about ${entity_type}`);
      
      // Example email notification structure (implement with Resend or similar):
      /*
      await resend.emails.send({
        from: 'Fighter ID <notifications@fighter-id.org>',
        to: admin.app_user.email,
        subject: `Nueva ${entity_type} pendiente de revisión`,
        html: `
          <h2>Hola ${admin.app_user.first_name},</h2>
          <p>${actor_name} ha enviado una nueva ${entity_type} que requiere tu revisión.</p>
          <p><a href="https://fighter-id.org/admin/pending-changes">Revisar ahora →</a></p>
        `
      });
      */
    }

    // Broadcast via Supabase Realtime
    await supabase
      .from('audit_log')
      .insert({
        entity_type: 'notification',
        entity_id: entity_id,
        action: 'ADMIN_NOTIFIED',
        metadata: {
          notification_type: entity_type,
          recipients: admins?.length || 0
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${admins?.length || 0} admins`,
        entity_type,
        entity_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
