import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStatusUpdates(fighterId: string | null) {
  const enabled = !!fighterId;
  const qc = useQueryClient();

  const updates = useQuery({
    queryKey: ['status_updates', fighterId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_status_updates')
        .select('*')
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addUpdate = useMutation({
    mutationFn: async (payload: {
      fighter_id: string;
      weight_kg?: number;
      bodyfat_pct?: number;
      injuries?: string;
      ready_to_fight?: boolean;
      note?: string;
    }) => {
      const { error } = await supabase.from('fighter_status_updates').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status_updates', fighterId] })
  });

  return { updates, addUpdate };
}