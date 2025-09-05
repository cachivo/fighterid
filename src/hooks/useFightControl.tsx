import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use Supabase generated types
export type FightOfficial = Database['public']['Tables']['fight_officials']['Row'];
export type FightScorecard = Database['public']['Tables']['fight_scorecards']['Row'];
export type FightControlEvent = Database['public']['Tables']['fight_control_events']['Row'];
export type FightResult = Database['public']['Tables']['fight_results']['Row'];
export type FightStatistics = Database['public']['Tables']['fight_statistics']['Row'];

// Extended types with relationships
export interface FightOfficialWithJudge extends FightOfficial {
  judges: {
    id: string;
    first_name: string;
    last_name: string;
    certification_level: string;
    email: string | null;
  } | null;
}

export interface ScorecardInput {
  fight_id: string;
  round_number: number;
  fighter_a_score: number;
  fighter_b_score: number;
  notes?: string;
  knockdown_fighter_a?: number;
  knockdown_fighter_b?: number;
  point_deduction_a?: number;
  point_deduction_b?: number;
}

export interface ControlEventInput {
  fight_id: string;
  event_type: string;
  round_number?: number;
  fighter_affected?: string;
  reason?: string;
  description?: string;
  metadata?: any;
}

export function useFightOfficials(fightId: string) {
  const [officials, setOfficials] = useState<FightOfficialWithJudge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOfficials = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fight_officials')
        .select(`
          *,
          judges!fight_officials_official_id_fkey (
            id, first_name, last_name, certification_level, email
          )
        `)
        .eq('fight_id', fightId)
        .order('role');

      if (error) throw error;
      setOfficials(data || []);
    } catch (err) {
      console.error('Error fetching fight officials:', err);
      toast({
        title: "Error",
        description: "Error al cargar oficiales de la pelea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fightId, toast]);

  const assignOfficial = async (officialId: string, role: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('fight_officials')
        .insert([{
          fight_id: fightId,
          official_id: officialId,
          role,
          notes,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Oficial asignado como ${role}`,
      });

      await fetchOfficials();
      return true;
    } catch (err) {
      toast({
        title: "Error", 
        description: "Error al asignar oficial",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeOfficial = async (officialAssignmentId: string) => {
    try {
      const { error } = await supabase
        .from('fight_officials')
        .delete()
        .eq('id', officialAssignmentId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Oficial removido de la pelea",
      });

      await fetchOfficials();
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al remover oficial",
        variant: "destructive",
      });
      return false;
    }
  };

  const confirmOfficial = async (officialAssignmentId: string) => {
    try {
      const { error } = await supabase
        .from('fight_officials')
        .update({ 
          confirmed: true, 
          confirmed_at: new Date().toISOString() 
        })
        .eq('id', officialAssignmentId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Oficial confirmado para la pelea",
      });

      await fetchOfficials();
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al confirmar oficial",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (fightId) {
      fetchOfficials();
    }
  }, [fightId, fetchOfficials]);

  return {
    officials,
    loading,
    fetchOfficials,
    assignOfficial,
    removeOfficial,
    confirmOfficial,
    getJudges: () => officials.filter(o => o.role.startsWith('JUDGE_')),
    getReferee: () => officials.find(o => o.role === 'REFEREE'),
    getSupervisor: () => officials.find(o => o.role === 'SUPERVISOR'),
  };
}

export function useFightScorecards(fightId: string, judgeId?: string) {
  const [scorecards, setScorecards] = useState<FightScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchScorecards = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('fight_scorecards')
        .select('*')
        .eq('fight_id', fightId);

      if (judgeId) {
        query = query.eq('judge_id', judgeId);
      }

      const { data, error } = await query.order('round_number');

      if (error) throw error;
      setScorecards(data || []);
    } catch (err) {
      console.error('Error fetching scorecards:', err);
      toast({
        title: "Error",
        description: "Error al cargar scorecards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fightId, judgeId, toast]);

  const submitScorecard = async (scoreData: ScorecardInput) => {
    try {
      const { error } = await supabase
        .from('fight_scorecards')
        .upsert([{
          ...scoreData,
          judge_id: judgeId,
          submitted_at: new Date().toISOString()
        }], {
          onConflict: 'fight_id,judge_id,round_number'
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Scorecard Round ${scoreData.round_number} guardado`,
      });

      await fetchScorecards();
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al guardar scorecard",
        variant: "destructive",
      });
      return false;
    }
  };

  const getScorecardsByRound = (roundNumber: number) => {
    return scorecards.filter(sc => sc.round_number === roundNumber);
  };

  const getTotalScores = () => {
    const totals: { [judgeId: string]: { a: number; b: number } } = {};
    
    scorecards.forEach(sc => {
      if (!totals[sc.judge_id]) {
        totals[sc.judge_id] = { a: 0, b: 0 };
      }
      totals[sc.judge_id].a += sc.fighter_a_score;
      totals[sc.judge_id].b += sc.fighter_b_score;
    });

    return totals;
  };

  useEffect(() => {
    if (fightId) {
      fetchScorecards();
    }
  }, [fightId, fetchScorecards]);

  return {
    scorecards,
    loading,
    fetchScorecards,
    submitScorecard,
    getScorecardsByRound,
    getTotalScores,
  };
}

export function useFightControl(fightId: string, refereeId?: string) {
  const [controlEvents, setControlEvents] = useState<FightControlEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchControlEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fight_control_events')
        .select('*')
        .eq('fight_id', fightId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setControlEvents(data || []);
    } catch (err) {
      console.error('Error fetching control events:', err);
      toast({
        title: "Error",
        description: "Error al cargar eventos de control",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fightId, toast]);

  const createControlEvent = async (eventData: ControlEventInput) => {
    try {
      const { error } = await supabase
        .from('fight_control_events')
        .insert([{
          ...eventData,
          referee_id: refereeId,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Evento Registrado",
        description: `${eventData.event_type} registrado exitosamente`,
      });

      await fetchControlEvents();
      return true;
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al registrar evento de control",
        variant: "destructive",
      });
      return false;
    }
  };

  const startFight = () => createControlEvent({
    fight_id: fightId,
    event_type: 'FIGHT_START',
    description: 'Inicio oficial de la pelea'
  });

  const stopFight = (reason?: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'FIGHT_STOP',
    reason,
    description: 'Pelea detenida por el referee'
  });

  const pauseFight = (reason?: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'FIGHT_PAUSE',
    reason,
    description: 'Pelea pausada temporalmente'
  });

  const resumeFight = () => createControlEvent({
    fight_id: fightId,
    event_type: 'FIGHT_RESUME',
    description: 'Pelea reanudada'
  });

  const registerKnockdown = (fighterId: string, roundNumber: number) => createControlEvent({
    fight_id: fightId,
    event_type: 'KNOCKDOWN',
    round_number: roundNumber,
    fighter_affected: fighterId,
    description: 'Knockdown registrado'
  });

  const registerFoul = (fighterId: string, roundNumber: number, reason: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'FOUL',
    round_number: roundNumber,
    fighter_affected: fighterId,
    reason,
    description: 'Foul registrado'
  });

  const deductPoint = (fighterId: string, roundNumber: number, reason: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'POINT_DEDUCTION',
    round_number: roundNumber,
    fighter_affected: fighterId,
    reason,
    description: 'Deducción de punto'
  });

  const endByTKO = (winnerId: string, roundNumber: number, reason: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'TKO',
    round_number: roundNumber,
    fighter_affected: winnerId,
    reason,
    description: 'Pelea terminada por TKO'
  });

  const endByKO = (winnerId: string, roundNumber: number) => createControlEvent({
    fight_id: fightId,
    event_type: 'KO',
    round_number: roundNumber,
    fighter_affected: winnerId,
    description: 'Pelea terminada por KO'
  });

  const endBySubmission = (winnerId: string, roundNumber: number, method: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'SUBMISSION',
    round_number: roundNumber,
    fighter_affected: winnerId,
    reason: method,
    description: 'Pelea terminada por sumisión'
  });

  const disqualifyFighter = (fighterId: string, reason: string) => createControlEvent({
    fight_id: fightId,
    event_type: 'DISQUALIFICATION',
    fighter_affected: fighterId,
    reason,
    description: 'Peleador descalificado'
  });

  useEffect(() => {
    if (fightId) {
      fetchControlEvents();
    }
  }, [fightId, fetchControlEvents]);

  return {
    controlEvents,
    loading,
    fetchControlEvents,
    createControlEvent,
    // Quick actions
    startFight,
    stopFight,
    pauseFight,
    resumeFight,
    registerKnockdown,
    registerFoul,
    deductPoint,
    endByTKO,
    endByKO,
    endBySubmission,
    disqualifyFighter,
    // State helpers
    getFightStatus: () => {
      const latest = controlEvents[0];
      return latest?.event_type || 'SCHEDULED';
    },
    isFightActive: () => {
      const latest = controlEvents[0];
      return latest?.event_type === 'FIGHT_START' || latest?.event_type === 'FIGHT_RESUME';
    },
    getEventsForRound: (roundNumber: number) => 
      controlEvents.filter(event => event.round_number === roundNumber)
  };
}