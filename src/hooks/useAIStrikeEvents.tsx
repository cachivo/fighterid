import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIStrikeEvent {
  id: number;
  fight_id: string;
  round_number: number;
  timestamp_ms: number;
  fighter: 'A' | 'B';
  event_type: 'strike_attempted' | 'strike_connected';
  strike_type: string | null;
  confidence: number;
  model_version: string;
  metadata: any;
  created_at: string;
}

export interface FightStats {
  fighter: 'A' | 'B';
  attempted_count: number;
  connected_count: number;
  accuracy: number;
  last_strike_ms: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string) => UUID_REGEX.test(value);

export function useAIStrikeEvents(fightId: string, roundNumber?: number) {
  const [events, setEvents] = useState<AIStrikeEvent[]>([]);
  const [stats, setStats] = useState<FightStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const shouldQuery = isValidUuid(fightId);

  const fetchEvents = useCallback(async () => {
    if (!shouldQuery) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('ai_strike_events')
        .select('*')
        .eq('fight_id', fightId)
        .order('timestamp_ms', { ascending: false });

      if (roundNumber !== undefined) {
        query = query.eq('round_number', roundNumber);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      setEvents((data as AIStrikeEvent[]) || []);
    } catch (err) {
      console.error('Error fetching AI strike events:', err);
      toast({
        title: "Error",
        description: "Error al cargar eventos de IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fightId, roundNumber, shouldQuery, toast]);

  const fetchStats = useCallback(async () => {
    if (!shouldQuery) {
      setStats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_ai_fight_stats', {
          p_fight_id: fightId,
          p_round_number: roundNumber || null,
        });

      if (error) throw error;
      setStats((data as FightStats[]) || []);
    } catch (err) {
      console.error('Error fetching AI fight stats:', err);
    }
  }, [fightId, roundNumber, shouldQuery]);

  // Realtime subscription
  useEffect(() => {
    if (!shouldQuery) {
      setEvents([]);
      setStats([]);
      setLoading(false);
      return;
    }

    fetchEvents();
    fetchStats();

    const channel = supabase
      .channel(`ai_strike_events:${fightId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_strike_events',
          filter: `fight_id=eq.${fightId}`,
        },
        (payload) => {
          const newEvent = payload.new as AIStrikeEvent;

          if (roundNumber === undefined || newEvent.round_number === roundNumber) {
            setEvents((prev) => [newEvent, ...prev].slice(0, 500));
          }

          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fightId, roundNumber, shouldQuery, fetchEvents, fetchStats]);

  const getEventsByFighter = (fighter: 'A' | 'B') => {
    return events.filter(e => e.fighter === fighter);
  };

  const getStatsByFighter = (fighter: 'A' | 'B') => {
    return stats.find(s => s.fighter === fighter) || {
      fighter,
      attempted_count: 0,
      connected_count: 0,
      accuracy: 0,
      last_strike_ms: 0,
    };
  };

  const getRecentEvents = (limit: number = 10) => {
    return events.slice(0, limit);
  };

  return {
    events,
    stats,
    loading,
    fetchEvents,
    fetchStats,
    getEventsByFighter,
    getStatsByFighter,
    getRecentEvents,
  };
}