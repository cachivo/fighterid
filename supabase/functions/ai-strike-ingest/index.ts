import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para eventos del microservicio Python
interface StrikeEvent {
  fightId: string;
  round: number;
  timestamp_ms: number;
  fighter: 'A' | 'B';
  event: 'strike_attempted' | 'strike_connected';
  strike_type: 'jab' | 'cross' | 'hook' | 'uppercut' | 'low_kick' | 'high_kick' | 'body_kick' | 'knee' | 'elbow' | 'other';
  confidence: number;
  model_version: string;
}

interface SessionStart {
  fightId: string;
  source: string;
  fighters: { A: string; B: string };
  model_version: string;
}

interface SessionStop {
  sessionId: string;
  stats?: {
    total_frames: number;
    avg_fps: number;
    avg_latency_ms: number;
  };
}

interface LogEntry {
  sessionId?: string;
  fightId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // ==========================================
    // POST /ai-strike-ingest/event - Recibir evento de golpe
    // ==========================================
    if (path === 'event' && req.method === 'POST') {
      const event: StrikeEvent = await req.json();
      
      // Validar evento
      if (!event.fightId || !event.round || !event.fighter || !event.event || !event.model_version) {
        console.error('Invalid event:', event);
        return new Response(
          JSON.stringify({ error: 'Invalid event format' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar confianza
      if (event.confidence < 0 || event.confidence > 1) {
        console.error('Invalid confidence:', event.confidence);
        return new Response(
          JSON.stringify({ error: 'Confidence must be between 0 and 1' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insertar evento
      const { data, error } = await supabase
        .from('ai_strike_events')
        .insert({
          fight_id: event.fightId,
          round_number: event.round,
          timestamp_ms: event.timestamp_ms,
          fighter: event.fighter,
          event_type: event.event,
          strike_type: event.strike_type || null,
          confidence: event.confidence,
          model_version: event.model_version,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting strike event:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Strike event inserted:', data);
      return new Response(
        JSON.stringify({ success: true, id: data.id }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/session/start - Iniciar sesión de inferencia
    // ==========================================
    if (path === 'start' && req.method === 'POST') {
      const session: SessionStart = await req.json();
      
      if (!session.fightId || !session.source || !session.model_version) {
        return new Response(
          JSON.stringify({ error: 'Invalid session start format' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('ai_inference_sessions')
        .insert({
          fight_id: session.fightId,
          source_url: session.source,
          model_version: session.model_version,
          status: 'running',
          metadata: { fighters: session.fighters },
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting session:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Inference session started:', data);
      return new Response(
        JSON.stringify({ success: true, sessionId: data.id }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/session/stop - Detener sesión
    // ==========================================
    if (path === 'stop' && req.method === 'POST') {
      const stopData: SessionStop = await req.json();
      
      if (!stopData.sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {
        status: 'stopped',
        stopped_at: new Date().toISOString(),
      };

      if (stopData.stats) {
        updateData.total_frames_processed = stopData.stats.total_frames;
        updateData.avg_fps = stopData.stats.avg_fps;
        updateData.avg_latency_ms = stopData.stats.avg_latency_ms;
      }

      const { data, error } = await supabase
        .from('ai_inference_sessions')
        .update(updateData)
        .eq('id', stopData.sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error stopping session:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Inference session stopped:', data);
      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POST /ai-strike-ingest/log - Recibir log del microservicio
    // ==========================================
    if (path === 'log' && req.method === 'POST') {
      const logEntry: LogEntry = await req.json();
      
      const { error } = await supabase
        .from('ai_inference_logs')
        .insert({
          session_id: logEntry.sessionId || null,
          fight_id: logEntry.fightId || null,
          level: logEntry.level,
          message: logEntry.message,
          metadata: logEntry.metadata || {},
        });

      if (error) {
        console.error('Error inserting log:', error);
        // No fallar por logs
      }

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET /ai-strike-ingest/health - Health check
    // ==========================================
    if (path === 'health' && req.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET /ai-strike-ingest/metrics - Obtener métricas de sesiones activas
    // ==========================================
    if (path === 'metrics' && req.method === 'GET') {
      const { data: sessions, error } = await supabase
        .from('ai_inference_sessions')
        .select('*')
        .eq('status', 'running')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching metrics:', error);
        return new Response(
          JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metrics = {
        active_sessions: sessions?.length || 0,
        sessions: sessions || [],
      };

      return new Response(
        JSON.stringify(metrics), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ruta no encontrada
    return new Response(
      JSON.stringify({ 
        error: 'Not found', 
        availableEndpoints: [
          'POST /event - Recibir evento de golpe',
          'POST /start - Iniciar sesión de inferencia',
          'POST /stop - Detener sesión',
          'POST /log - Registrar log',
          'GET /health - Health check',
          'GET /metrics - Métricas de sesiones activas',
        ]
      }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});