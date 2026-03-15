import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelemetryEvent {
  id: number;
  session_id: string;
  fighter_id: string | null;
  fighter_corner: string | null;
  strike_type: string | null;
  confidence: number | null;
  round: number | null;
  timestamp_video: number | null;
  created_at: string;
}

export interface FightMeta {
  eventName: string;
  fightNumber: number | null;
  redName: string;
  blueName: string;
  startedAt: string;
}

export function useFightTelemetry(fightId?: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [fightMeta, setFightMeta] = useState<FightMeta | null>(null);
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!fightId) return;
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      try {
        // 1. Fetch fight data (no joins)
        const { data: fight } = await supabase
          .from('fights')
          .select('id, fight_number, fighter_a_id, fighter_b_id, event_id')
          .eq('id', fightId)
          .single();

        if (!fight || !isMounted) return;

        // 2. Parallel: event name + fighter names
        const [eventRes, redRes, blueRes] = await Promise.all([
          fight.event_id
            ? supabase.from('bdg_event').select('name').eq('id', fight.event_id).single()
            : Promise.resolve({ data: null }),
          fight.fighter_a_id
            ? supabase.from('fighter_profiles').select('first_name, last_name').eq('id', fight.fighter_a_id).single()
            : Promise.resolve({ data: null }),
          fight.fighter_b_id
            ? supabase.from('fighter_profiles').select('first_name, last_name').eq('id', fight.fighter_b_id).single()
            : Promise.resolve({ data: null }),
        ]);

        if (!isMounted) return;

        const meta: FightMeta = {
          eventName: eventRes.data?.name || 'Evento',
          fightNumber: fight.fight_number ?? null,
          redName: redRes.data ? `${redRes.data.first_name} ${redRes.data.last_name}` : 'Peleador A',
          blueName: blueRes.data ? `${blueRes.data.first_name} ${blueRes.data.last_name}` : 'Peleador B',
          startedAt: new Date().toISOString(),
        };
        setFightMeta(meta);

        // 3. Reuse existing active session or create new one
        let session: any = null;

        const { data: existing } = await (supabase as any)
          .from('fight_telemetry_sessions')
          .select('id, session_token, started_at')
          .eq('fight_id', fightId)
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          session = existing[0];
        } else {
          const token = crypto.randomUUID();
          const { data: newSession, error } = await (supabase as any)
            .from('fight_telemetry_sessions')
            .insert({
              fight_id: fightId,
              event_id: fight.event_id ?? null,
              fighter_red_id: fight.fighter_a_id ?? null,
              fighter_blue_id: fight.fighter_b_id ?? null,
              session_token: token,
              hud_connected: true,
              status: 'active',
            })
            .select('id, session_token, started_at')
            .single();
          if (error) throw error;
          session = newSession;
        }

        if (!session || !isMounted) return;

        setSessionToken(session.session_token);
        setSessionId(session.id);
        setStatus('active');

        // 3b. Load existing events for this session
        const { data: existingEvents } = await (supabase as any)
          .from('fight_telemetry_events')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (existingEvents && isMounted) {
          setTelemetryEvents(existingEvents);
        }

        // 4. Realtime subscription for telemetry events
        channel = supabase
          .channel(`telemetry-events:${session.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'fight_telemetry_events',
              filter: `session_id=eq.${session.id}`,
            },
            (payload) => {
              if (!isMounted) return;
              setTelemetryEvents(prev => [...prev, payload.new as TelemetryEvent]);
            }
          )
          .subscribe();

        // 5. Heartbeat every 15s
        heartbeatRef.current = setInterval(async () => {
          await (supabase as any)
            .from('fight_telemetry_sessions')
            .update({ last_heartbeat: new Date().toISOString() })
            .eq('id', session.id);
        }, 15000);
      } catch (err) {
        console.error('Error initializing fight telemetry:', err);
        if (isMounted) setStatus('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [fightId]);

  // Aggregate strikes by corner and type
  const strikesByCorner = useMemo(() => {
    const result: Record<string, Record<string, number>> = { red: {}, blue: {} };
    for (const e of telemetryEvents) {
      const corner = e.fighter_corner === 'red' ? 'red' : 'blue';
      const type = e.strike_type || 'other';
      result[corner][type] = (result[corner][type] || 0) + 1;
    }
    return result;
  }, [telemetryEvents]);

  const shortSession = useMemo(
    () => (sessionToken ? sessionToken.slice(0, 8) : '--------'),
    [sessionToken]
  );

  return {
    sessionToken,
    shortSession,
    sessionId,
    telemetryEvents,
    fightMeta,
    status,
    strikesByCorner,
  };
}
