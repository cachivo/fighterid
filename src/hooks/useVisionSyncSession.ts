import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VisionSyncState = 'connecting' | 'waiting' | 'synced' | 'error';

interface StartSessionResponse {
  session_token: string;
  hud_connected: boolean;
  vision_connected: boolean;
}

export function useVisionSyncSession(fightId?: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [status, setStatus] = useState<VisionSyncState>('connecting');
  const [hudConnected, setHudConnected] = useState(false);
  const [visionConnected, setVisionConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const startSession = async () => {
      setStatus('connecting');
      setHudConnected(false);
      setVisionConnected(false);
      setSessionToken(null);

      const { data, error } = await supabase.functions.invoke('vision-start-session', {
        body: {
          fight_id: fightId || null,
        },
      });

      if (error) throw error;

      const session = data as StartSessionResponse | null;
      if (!session?.session_token) {
        throw new Error('No se recibió session_token');
      }

      if (!isMounted) return;

      setSessionToken(session.session_token);
      setHudConnected(Boolean(session.hud_connected));
      setVisionConnected(Boolean(session.vision_connected));
      setStatus(session.vision_connected ? 'synced' : 'waiting');

      channel = supabase
        .channel(`vision-sync:${session.session_token}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'vision_sync_sessions',
            filter: `session_token=eq.${session.session_token}`,
          },
          (payload) => {
            const row = payload.new as { vision_connected?: boolean; hud_connected?: boolean };
            const nextVisionConnected = Boolean(row.vision_connected);

            setHudConnected(Boolean(row.hud_connected ?? true));
            setVisionConnected(nextVisionConnected);
            setStatus(nextVisionConnected ? 'synced' : 'waiting');
          }
        )
        .subscribe();
    };

    startSession().catch((err) => {
      console.error('Error creating vision sync session:', err);
      if (!isMounted) return;
      setStatus('error');
      setHudConnected(false);
      setVisionConnected(false);
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fightId]);

  const shortSession = useMemo(
    () => (sessionToken ? sessionToken.slice(0, 8) : '--------'),
    [sessionToken]
  );

  return {
    sessionToken,
    shortSession,
    status,
    hudConnected,
    visionConnected,
  };
}
