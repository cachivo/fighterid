import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GymOption {
  id: string;
  nombre: string;
  logo_url: string | null;
  slug: string;
}

export function useGymsList() {
  return useQuery({
    queryKey: ['gyms-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, nombre, logo_url, slug')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as GymOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
