import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FighterFilters {
  discipline?: string;
  level?: string;
  weightClass?: string;
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
  /** Set to true in admin contexts to bypass moderation filtering */
  includeUnapproved?: boolean;
}

export function useFightersQuery(filters?: FighterFilters) {
  const {
    discipline,
    level,
    weightClass,
    search,
    active = true,
    page = 1,
    pageSize = 100,
    includeUnapproved = false,
  } = filters || {};

  return useQuery({
    queryKey: ['fighters', { discipline, level, weightClass, search, active, page, pageSize, includeUnapproved }],
    queryFn: async () => {
      let query = supabase
        .from('fighter_profiles')
        .select('*, gym:gyms!gym_id(id, nombre, logo_url, slug)', { count: 'exact' });

      if (!includeUnapproved) {
        query = query.eq('moderation_status', 'approved');
      }

      if (active !== undefined) {
        query = query.eq('active', active);
      }

      if (discipline && discipline !== 'all') {
        query = query.eq('discipline', discipline as any);
      }

      if (level && level !== 'all') {
        query = query.eq('level', level);
      }

      if (weightClass && weightClass !== 'all') {
        query = query.eq('weight_class', weightClass);
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,nickname.ilike.%${term}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        fighters: data || [],
        totalCount: count || 0,
      };
    },
    staleTime: 30_000,
  });
}
