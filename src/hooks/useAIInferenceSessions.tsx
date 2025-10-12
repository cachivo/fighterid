import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIInferenceSession {
  id: string;
  fight_id: string;
  source_url: string;
  status: 'running' | 'stopped' | 'error' | 'paused';
  started_at: string;
  stopped_at: string | null;
  avg_fps: number | null;
  avg_latency_ms: number | null;
  total_frames_processed: number;
  model_version: string;
  metadata: any;
  created_by: string | null;
}

export function useAIInferenceSessions(fightId?: string) {
  const [sessions, setSessions] = useState<AIInferenceSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<AIInferenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('ai_inference_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (fightId) {
        query = query.eq('fight_id', fightId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedSessions = (data as AIInferenceSession[]) || [];
      setSessions(typedSessions);
      setActiveSessions(typedSessions.filter(s => s.status === 'running'));
    } catch (err) {
      console.error('Error fetching AI sessions:', err);
      toast({
        title: "Error",
        description: "Error al cargar sesiones de inferencia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fightId, toast]);

  // Realtime subscription
  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel('ai_inference_sessions_all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_inference_sessions',
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions]);

  const getSessionById = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const hasActiveSession = (checkFightId: string) => {
    return activeSessions.some(s => s.fight_id === checkFightId);
  };

  return {
    sessions,
    activeSessions,
    loading,
    fetchSessions,
    getSessionById,
    hasActiveSession,
    totalActiveSessions: activeSessions.length,
  };
}