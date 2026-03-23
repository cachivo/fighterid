import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RecordType = 'AMATEUR' | 'PROFESSIONAL';

export interface FighterRecord {
  wins: number;
  losses: number;
  draws: number;
  totalFights: number;
  winPercentage: number;
}

export function useFighterHistory(fighterId: string | null) {
  const enabled = !!fighterId;

  const { data: fightHistory, isLoading, error } = useQuery({
    queryKey: ['fighter_history', fighterId],
    enabled,
    queryFn: async () => {
      if (!fighterId) return [];
      
      const { data, error } = await supabase
        .from('fights_full' as any)
        .select('*')
        .or(`fighter_a_id.eq.${fighterId},fighter_b_id.eq.${fighterId}`)
        .eq('status', 'finished');
      
      if (error) throw error;
      return data || [];
    },
  });

  const calculateRecord = (recordType: RecordType): FighterRecord => {
    if (!fightHistory || !fighterId) {
      return { wins: 0, losses: 0, draws: 0, totalFights: 0, winPercentage: 0 };
    }

    // Filter fights by type
    let filteredFights = fightHistory;
    
    if (recordType === 'AMATEUR') {
      filteredFights = fightHistory.filter(fight => fight.fight_type === 'AMATEUR');
    } else if (recordType === 'PROFESSIONAL') {
      filteredFights = fightHistory.filter(fight => fight.fight_type === 'PROFESSIONAL');
    }

    let wins = 0;
    let losses = 0;
    let draws = 0;

    filteredFights.forEach(fight => {
      if (fight.winner_id === fighterId) {
        // This fighter won
        wins++;
      } else if (fight.winner_id && fight.winner_id !== fighterId) {
        // Another fighter won
        if (fight.fighter_a_id === fighterId || fight.fighter_b_id === fighterId) {
          losses++;
        }
      } else if (!fight.winner_id && (fight.fighter_a_id === fighterId || fight.fighter_b_id === fighterId)) {
        // No winner means draw (only if this fighter participated)
        draws++;
      }
    });

    const totalFights = wins + losses + draws;
    const winPercentage = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;

    return {
      wins,
      losses,
      draws,
      totalFights,
      winPercentage
    };
  };

  return {
    fightHistory,
    isLoading,
    error,
    calculateRecord,
    // Helper methods for each record type
    getAmateurRecord: () => calculateRecord('AMATEUR'),
    getProfessionalRecord: () => calculateRecord('PROFESSIONAL'),
  };
}