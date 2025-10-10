import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScoringEvent } from '@/lib/scoring-types';

export function useRealtimeScoring(roundId: string) {
  const [events, setEvents] = useState<ScoringEvent[]>([]);
  
  useEffect(() => {
    if (!roundId) return;
    
    // Cargar eventos existentes
    const loadEvents = async () => {
      const { data } = await supabase
        .from('scoring_events')
        .select('*')
        .eq('round_id', roundId)
        .order('timestamp_ms');
      
      if (data) setEvents(data as ScoringEvent[]);
    };
    
    loadEvents();
    
    // Suscribirse a nuevos eventos en tiempo real
    const channel = supabase.channel(`scoring:${roundId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scoring_events',
          filter: `round_id=eq.${roundId}`
        },
        (payload) => {
          setEvents(prev => [...prev, payload.new as ScoringEvent]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roundId]);
  
  return { events };
}
