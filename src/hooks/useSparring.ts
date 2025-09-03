import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSparring(fighterId: string | null) {
  const enabled = !!fighterId;
  const qc = useQueryClient();

  const inbox = useQuery({
    queryKey: ['sparring_inbox', fighterId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sparring_requests')
        .select(`
          *,
          from_fighter:fighter_profiles!sparring_requests_from_fighter_id_fkey(first_name, last_name, nickname),
          to_fighter:fighter_profiles!sparring_requests_to_fighter_id_fkey(first_name, last_name, nickname)
        `)
        .or(`to_fighter_id.eq.${fighterId},from_fighter_id.eq.${fighterId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (payload: {
      from_fighter_id: string;
      to_fighter_id?: string | null;
      discipline: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
      weight_range?: string;
      proposed_at?: string;
      location?: string;
      message?: string;
    }) => {
      const { error } = await supabase.from('sparring_requests').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparring_inbox', fighterId] })
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending'|'accepted'|'declined'|'cancelled'|'expired' }) => {
      const { error } = await supabase.from('sparring_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparring_inbox', fighterId] })
  });

  return { inbox, createRequest, updateStatus };
}