import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Round {
  id: string;
  fight_id: string;
  number: number;
  status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
  starts_at: string | null;
  ends_at: string | null;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export function useRoundControl(fightId: string) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRounds = useCallback(async () => {
    if (!fightId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('fight_rounds')
      .select('*')
      .eq('fight_id', fightId)
      .order('number');

    if (error) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    setRounds((data as Round[]) || []);
    setLoading(false);
  }, [fightId, toast]);

  const startRound = async (roundId: string) => {
    const { data, error } = await supabase.rpc('control_round', {
      p_round_id: roundId,
      p_action: 'start'
    });

    if (error) {
      toast({ 
        title: "Error al iniciar round", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    toast({ 
      title: "Round Iniciado", 
      description: "Reloj corriendo" 
    });
    await fetchRounds();
    return true;
  };

  const pauseRound = async (roundId: string) => {
    const { data, error } = await supabase.rpc('control_round', {
      p_round_id: roundId,
      p_action: 'pause'
    });

    if (error) {
      toast({ 
        title: "Error al pausar round", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    toast({ 
      title: "Round Pausado",
      description: "Tiempo detenido"
    });
    await fetchRounds();
    return true;
  };

  const endRound = async (roundId: string) => {
    const { data, error } = await supabase.rpc('control_round', {
      p_round_id: roundId,
      p_action: 'end'
    });

    if (error) {
      toast({ 
        title: "Error al finalizar round", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    toast({ 
      title: "Round Finalizado",
      description: "Round terminado exitosamente"
    });
    await fetchRounds();
    return true;
  };

  const cancelRound = async (roundId: string) => {
    const { data, error } = await supabase.rpc('control_round', {
      p_round_id: roundId,
      p_action: 'cancel'
    });

    if (error) {
      toast({ 
        title: "Error al cancelar round", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    toast({ 
      title: "Round Cancelado" 
    });
    await fetchRounds();
    return true;
  };

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // Realtime subscription
  useEffect(() => {
    if (!fightId) return;

    const channel = supabase
      .channel(`fight_rounds:${fightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fight_rounds',
          filter: `fight_id=eq.${fightId}`
        },
        () => {
          fetchRounds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fightId, fetchRounds]);

  return {
    rounds,
    loading,
    fetchRounds,
    startRound,
    pauseRound,
    endRound,
    cancelRound,
    getCurrentRound: () => rounds.find(r => r.status === 'live'),
    getNextRound: () => rounds.find(r => r.status === 'scheduled'),
    getPausedRound: () => rounds.find(r => r.status === 'paused'),
  };
}
