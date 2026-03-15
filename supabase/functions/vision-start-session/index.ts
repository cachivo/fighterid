import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase env vars missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop() || '';
    const body = await req.json().catch(() => ({}));

    // ─── Legacy: vision_sync_sessions ───
    if ((path === 'vision-start-session' || path === 'start-session') && req.method === 'POST') {
      const sessionToken = crypto.randomUUID();
      const { data, error } = await supabase
        .from('vision_sync_sessions')
        .insert({
          session_token: sessionToken,
          fight_id: body.fight_id ?? null,
          hud_connected: true,
          vision_connected: false,
        })
        .select('session_token, hud_connected, vision_connected, created_at')
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Legacy: vision connect ───
    if (path === 'connect' && req.method === 'POST') {
      if (!body.session_token) {
        return new Response(JSON.stringify({ error: 'session_token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const updatePayload: Record<string, unknown> = { vision_connected: true };
      if (body.fight_id) updatePayload.fight_id = body.fight_id;

      const { data, error } = await supabase
        .from('vision_sync_sessions')
        .update(updatePayload)
        .eq('session_token', body.session_token)
        .select('session_token, hud_connected, vision_connected, created_at')
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Telemetry: create session from external vision motor ───
    if (path === 'telemetry' && req.method === 'POST') {
      if (!body.session_token) {
        return new Response(JSON.stringify({ error: 'session_token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Mark vision_connected on the telemetry session
      const { data, error } = await supabase
        .from('fight_telemetry_sessions')
        .update({ vision_connected: true, last_heartbeat: new Date().toISOString() })
        .eq('session_token', body.session_token)
        .select('id, session_token, fight_id, hud_connected, vision_connected, status')
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'POST /vision-start-session',
          'POST /vision-start-session/connect',
          'POST /vision-start-session/telemetry',
        ],
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error in vision-start-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
