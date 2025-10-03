import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FighterRankingData {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  avatar_url: string | null;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  discipline: string | null;
  level: string | null;
  weight_class: string;
  country: string;
  win_rate: number;
  total_fights: number;
}

interface RankingStats {
  total_fighters: number;
  total_fights: number;
  professional_fighters: number;
  weight_classes: number;
  most_popular_discipline: string;
  undefeated_count: number;
}

export function useFighterRanking(minFights: number = 3) {
  const { data: fighters, isLoading: loadingFighters, error: fightersError } = useQuery({
    queryKey: ['fighter-ranking', minFights],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname, avatar_url, record_wins, record_losses, record_draws, discipline, level, weight_class, country')
        .eq('active', true)
        .order('record_wins', { ascending: false });

      if (error) throw error;

      // Calcular estadísticas y win rate
      const processed = data.map(fighter => {
        const total_fights = fighter.record_wins + fighter.record_losses + fighter.record_draws;
        const win_rate = total_fights > 0 ? (fighter.record_wins / total_fights) * 100 : 0;
        
        return {
          ...fighter,
          total_fights,
          win_rate,
          record_wins: fighter.record_wins || 0,
          record_losses: fighter.record_losses || 0,
          record_draws: fighter.record_draws || 0,
        };
      });

      // Filtrar por mínimo de peleas y ordenar por win rate
      return processed
        .filter(f => f.total_fights >= minFights)
        .sort((a, b) => {
          // Primero por win rate, luego por total de victorias
          if (b.win_rate !== a.win_rate) {
            return b.win_rate - a.win_rate;
          }
          return b.record_wins - a.record_wins;
        })
        .slice(0, 10); // Top 10
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['fighter-stats'],
    queryFn: async () => {
      // Obtener todos los peleadores activos
      const { data: allFighters, error: fightersError } = await supabase
        .from('fighter_profiles')
        .select('discipline, level, weight_class, record_wins, record_losses, record_draws')
        .eq('active', true);

      if (fightersError) throw fightersError;

      // Obtener total de peleas del historial
      const { count: fightsCount, error: fightsError } = await supabase
        .from('fights_history')
        .select('*', { count: 'exact', head: true });

      if (fightsError) throw fightsError;

      // Calcular estadísticas
      const total_fighters = allFighters?.length || 0;
      const professional_fighters = allFighters?.filter(f => f.level === 'Profesional' || f.level === 'Semi-profesional').length || 0;
      
      // Categorías de peso únicas
      const uniqueWeightClasses = new Set(allFighters?.map(f => f.weight_class).filter(Boolean));
      const weight_classes = uniqueWeightClasses.size;

      // Disciplina más popular
      const disciplineCounts: { [key: string]: number } = {};
      allFighters?.forEach(f => {
        if (f.discipline) {
          disciplineCounts[f.discipline] = (disciplineCounts[f.discipline] || 0) + 1;
        }
      });
      const most_popular_discipline = Object.entries(disciplineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MMA';

      // Peleadores invictos
      const undefeated_count = allFighters?.filter(f => 
        (f.record_wins > 0) && (f.record_losses === 0)
      ).length || 0;

      const stats: RankingStats = {
        total_fighters,
        total_fights: fightsCount || 0,
        professional_fighters,
        weight_classes,
        most_popular_discipline,
        undefeated_count,
      };

      return stats;
    },
  });

  return {
    fighters: fighters as FighterRankingData[] | undefined,
    stats,
    isLoading: loadingFighters || loadingStats,
    error: fightersError,
  };
}
