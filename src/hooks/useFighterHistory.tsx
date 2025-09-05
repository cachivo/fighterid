import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RecordType = 'TOTAL' | 'AMATEUR' | 'PROFESSIONAL';

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
        .from('fights_history')
        .select('*')
        .or(`red_fighter_id.eq.${fighterId},blue_fighter_id.eq.${fighterId}`);
      
      if (error) throw error;
      return data || [];
    },
  });

  const calculateRecord = (recordType: RecordType): FighterRecord => {
    if (!fightHistory || !fighterId) {
      return { wins: 0, losses: 0, draws: 0, totalFights: 0, winPercentage: 0 };
    }

    // For now, we'll use a simple heuristic to determine fight type based on organization
    // Professional organizations might contain these keywords
    const professionalOrgs = ['ufc', 'bellator', 'one', 'pfl', 'strikeforce', 'pride', 'wec'];
    
    let filteredFights = fightHistory;
    
    if (recordType === 'AMATEUR') {
      // Filter amateur fights (not in professional orgs)
      filteredFights = fightHistory.filter(fight => {
        const eventName = fight.event_name?.toLowerCase() || '';
        return !professionalOrgs.some(org => eventName.includes(org));
      });
    } else if (recordType === 'PROFESSIONAL') {
      // Filter professional fights (in professional orgs or explicitly marked)
      filteredFights = fightHistory.filter(fight => {
        const eventName = fight.event_name?.toLowerCase() || '';
        return professionalOrgs.some(org => eventName.includes(org));
      });
    }
    // TOTAL uses all fights (no filtering)

    let wins = 0;
    let losses = 0;
    let draws = 0;

    filteredFights.forEach(fight => {
      if (fight.result === 'red_win') {
        // Red fighter won
        if (fight.red_fighter_id === fighterId) {
          wins++;
        } else if (fight.blue_fighter_id === fighterId) {
          losses++;
        }
      } else if (fight.result === 'blue_win') {
        // Blue fighter won
        if (fight.blue_fighter_id === fighterId) {
          wins++;
        } else if (fight.red_fighter_id === fighterId) {
          losses++;
        }
      } else if (fight.result === 'draw') {
        // Both fighters get a draw
        if ((fight.red_fighter_id === fighterId) || (fight.blue_fighter_id === fighterId)) {
          draws++;
        }
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
    getTotalRecord: () => calculateRecord('TOTAL'),
    getAmateurRecord: () => calculateRecord('AMATEUR'),
    getProfessionalRecord: () => calculateRecord('PROFESSIONAL'),
  };
}