import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GymOption {
  id: string;
  nombre: string;
  logo_url: string | null;
  slug: string;
  moderation_status?: string;
}

interface UseGymsListOptions {
  /** Set true in admin contexts to include pending/rejected gyms */
  includeUnapproved?: boolean;
}

export function useGymsList(options?: UseGymsListOptions) {
  const includeUnapproved = options?.includeUnapproved ?? false;
  return useQuery({
    queryKey: ['gyms-list', includeUnapproved],
    queryFn: async () => {
      let query = supabase
        .from('gyms')
        .select('id, nombre, logo_url, slug, moderation_status')
        .eq('activo', true);
      if (!includeUnapproved) {
        query = query.eq('moderation_status', 'approved');
      }
      const { data, error } = await query.order('nombre');
      if (error) throw error;
      return data as GymOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
