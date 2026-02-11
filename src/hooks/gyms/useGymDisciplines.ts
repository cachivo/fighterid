import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Discipline {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export function useAllDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('id, name, slug')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as Discipline[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGymDisciplines(gymId?: string) {
  return useQuery({
    queryKey: ['gym-disciplines', gymId],
    queryFn: async () => {
      if (!gymId) {
        const { data, error } = await supabase
          .from('disciplines')
          .select('*')
          .eq('active', true)
          .order('name');
        if (error) throw error;
        return data as Discipline[];
      }

      const { data, error } = await supabase
        .from('gym_disciplines')
        .select('discipline_id, disciplines(id, name, slug, active)')
        .eq('gym_id', gymId);

      if (error) throw error;
      return (data || []).map((d: any) => d.disciplines).filter(Boolean) as Discipline[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateGymDisciplines(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (disciplineIds: string[]) => {
      // Delete existing
      const { error: deleteError } = await supabase
        .from('gym_disciplines')
        .delete()
        .eq('gym_id', gymId);

      if (deleteError) throw deleteError;

      // Insert new
      if (disciplineIds.length > 0) {
        const { error: insertError } = await supabase
          .from('gym_disciplines')
          .insert(disciplineIds.map(id => ({ gym_id: gymId, discipline_id: id })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-disciplines', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard', gymId] });
      toast.success('Disciplinas actualizadas');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
}
