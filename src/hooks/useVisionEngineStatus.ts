import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisionEngineStatus {
  isLive: boolean;
  deviceId: string | null;
  lastHeartbeat: string | null;
  status: string | null;
}

const HEARTBEAT_THRESHOLD_MS = 10_000;
const POLL_INTERVAL_MS = 3_000;

export function useVisionEngineStatus(fightId: string | undefined): VisionEngineStatus {
  const [session, setSession] = useState<{
    device_id: string | null;
    last_heartbeat: string | null;
    status: string | null;
  } | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Fetch initial session
  useEffect(() => {
    if (!fightId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('fight_telemetry_sessions')
        .select('last_heartbeat, status')
        .eq('fight_id', fightId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      if (data) setSession({ device_id: (data as any).device_id ?? null, last_heartbeat: data.last_heartbeat, status: data.status });
    };

    fetch();
  }, [fightId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!fightId) return;

    const channel = supabase
      .channel(`vision-status-${fightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fight_telemetry_sessions',
          filter: `fight_id=eq.${fightId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            setSession({
              device_id: row.device_id,
              last_heartbeat: row.last_heartbeat,
              status: row.status,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fightId]);

  // Evaluate isLive every 3 seconds
  const evaluate = useCallback(() => {
    if (!session?.last_heartbeat) {
      setIsLive(false);
      return;
    }
    const diff = Date.now() - new Date(session.last_heartbeat).getTime();
    setIsLive(diff < HEARTBEAT_THRESHOLD_MS && session.status === 'connected');
  }, [session]);

  useEffect(() => {
    evaluate();
    const interval = setInterval(evaluate, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [evaluate]);

  return {
    isLive,
    deviceId: session?.device_id ?? null,
    lastHeartbeat: session?.last_heartbeat ?? null,
    status: session?.status ?? null,
  };
}
