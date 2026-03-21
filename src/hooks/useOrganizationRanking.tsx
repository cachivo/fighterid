import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  id: string;
  fighter_id: string;
  fighter: {
    first_name: string;
    last_name: string;
    nickname: string | null;
    avatar_url: string | null;
    country: string | null;
    gender: string | null;
    mma_record_wins: number | null;
    mma_record_losses: number | null;
    mma_record_draws: number | null;
    boxeo_record_wins: number | null;
    boxeo_record_losses: number | null;
    boxeo_record_draws: number | null;
    record_wins: number | null;
    record_losses: number | null;
    record_draws: number | null;
    gym_name: string | null;
  };
  weight_class: string;
  level: string;
  ranking_position: number | null;
  points: number;
  is_champion: boolean;
  is_active: boolean;
  last_fight_date: string | null;
}

export interface OrganizationRankingResult {
  rankings: RankingEntry[];
  totalCount: number;
  hasMore: boolean;
  weightClasses: string[];
  levels: string[];
  levelCounts: Record<string, number>;
  discipline: 'MMA' | 'Boxeo';
  globalStats: {
    totalFighters: number;
    totalChampions: number;
    totalProfessionals: number;
  };
}

export function useOrganizationRanking(
  organizationCode: string,
  level?: string,
  weightClass?: string,
  gender?: string,
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: ['organization-ranking', organizationCode, level, weightClass, gender, page, pageSize],
    queryFn: async (): Promise<OrganizationRankingResult> => {
      // First get the organization ID
      const { data: org, error: orgError } = await supabase
        .from('ranking_organizations')
        .select('id, allowed_levels, discipline')
        .eq('code', organizationCode)
        .single();

      if (orgError) throw orgError;

      // Build query for rankings with server-side pagination
      let query = supabase
        .from('fighter_rankings')
        .select(`
          id,
          fighter_id,
          weight_class,
          level,
          ranking_position,
          points,
          is_champion,
          is_active,
          last_fight_date,
          fighter_profiles!inner (
            first_name,
            last_name,
            nickname,
            avatar_url,
            country,
            gender,
            mma_record_wins,
            mma_record_losses,
            mma_record_draws,
            boxeo_record_wins,
            boxeo_record_losses,
            boxeo_record_draws,
            record_wins,
            record_losses,
            record_draws,
            gym_name
          )
        `, { count: 'exact' })
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .order('points', { ascending: false })
        .order('is_champion', { ascending: false });

      // Apply filters
      if (level) {
        query = query.eq('level', level);
      }
      if (weightClass) {
        query = query.eq('weight_class', weightClass);
      }
      if (gender) {
        query = query.eq('fighter_profiles.gender', gender);
      }

      // Server-side pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Run paginated query and global stats in parallel
      const [rankingsResult, filtersResult, statsResult] = await Promise.all([
        query,
        // Filters query (weight classes, levels)
        supabase
          .from('fighter_rankings')
          .select('weight_class, level')
          .eq('organization_id', org.id)
          .eq('is_active', true),
        // Global stats query (champions + professionals count across entire org)
        supabase
          .from('fighter_rankings')
          .select('id, is_champion, level', { count: 'exact' })
          .eq('organization_id', org.id)
          .eq('is_active', true),
      ]);

      if (rankingsResult.error) throw rankingsResult.error;

      const filtersData = filtersResult.data;
      const statsData = statsResult.data || [];

      const weightClasses = [...new Set(filtersData?.map(r => r.weight_class) || [])].sort();
      const levels = [...new Set(filtersData?.map(r => r.level) || [])].filter(
        l => org.allowed_levels.includes(l)
      );

      const levelCounts: Record<string, number> = {};
      filtersData?.forEach(r => {
        levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
      });

      // Global stats from full dataset
      const totalFighters = statsResult.count || 0;
      const totalChampions = statsData.filter(r => r.is_champion).length;
      const totalProfessionals = statsData.filter(r => r.level === 'Profesional').length;

      // Transform data
      const rankings: RankingEntry[] = (rankingsResult.data || []).map((r: any) => ({
        id: r.id,
        fighter_id: r.fighter_id,
        fighter: {
          first_name: r.fighter_profiles.first_name,
          last_name: r.fighter_profiles.last_name,
          nickname: r.fighter_profiles.nickname,
          avatar_url: r.fighter_profiles.avatar_url,
          country: r.fighter_profiles.country,
          gender: r.fighter_profiles.gender,
          mma_record_wins: r.fighter_profiles.mma_record_wins,
          mma_record_losses: r.fighter_profiles.mma_record_losses,
          mma_record_draws: r.fighter_profiles.mma_record_draws,
          boxeo_record_wins: r.fighter_profiles.boxeo_record_wins,
          boxeo_record_losses: r.fighter_profiles.boxeo_record_losses,
          boxeo_record_draws: r.fighter_profiles.boxeo_record_draws,
          record_wins: r.fighter_profiles.record_wins,
          record_losses: r.fighter_profiles.record_losses,
          record_draws: r.fighter_profiles.record_draws,
          gym_name: r.fighter_profiles.gym_name,
        },
        weight_class: r.weight_class,
        level: r.level,
        ranking_position: r.ranking_position,
        points: r.points,
        is_champion: r.is_champion,
        is_active: r.is_active,
        last_fight_date: r.last_fight_date,
      }));

      const totalCount = rankingsResult.count || 0;

      return {
        rankings,
        totalCount,
        hasMore: from + pageSize < totalCount,
        weightClasses,
        levels,
        levelCounts,
        discipline: org.discipline as 'MMA' | 'Boxeo',
        globalStats: {
          totalFighters,
          totalChampions,
          totalProfessionals,
        },
      };
    },
    enabled: !!organizationCode,
  });
}
