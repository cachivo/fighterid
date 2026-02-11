import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGymMembership(fighterId: string) {
  return useQuery({
    queryKey: ['gym-membership', fighterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_gym_memberships')
        .select(`
          id, gym_id, coach_user_id, status, joined_at,
          gyms(id, nombre, slug, logo_url)
        `)
        .eq('fighter_id', fighterId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!fighterId,
    staleTime: 60_000,
  });
}

export function useAddMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { fighterId: string; gymId: string; coachUserId?: string }) => {
      const { data, error } = await supabase
        .from('fighter_gym_memberships')
        .insert({
          fighter_id: params.fighterId,
          gym_id: params.gymId,
          coach_user_id: params.coachUserId || null,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gym-membership', vars.fighterId] });
      queryClient.invalidateQueries({ queryKey: ['gym-fighters', vars.gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard', vars.gymId] });
      toast.success('Peleador vinculado al gimnasio');
    },
    onError: (error: any) => {
      if (error.message?.includes('unique_active_membership')) {
        toast.error('Este peleador ya tiene un gimnasio activo. Debe transferirse primero.');
      } else {
        toast.error('Error: ' + error.message);
      }
    },
  });
}

export function useTransferFighter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { fighterId: string; fromGymId: string; toGymId: string; coachUserId?: string }) => {
      // Mark old membership as TRANSFERRED
      const { error: updateError } = await supabase
        .from('fighter_gym_memberships')
        .update({ status: 'TRANSFERRED', left_at: new Date().toISOString() })
        .eq('fighter_id', params.fighterId)
        .eq('gym_id', params.fromGymId)
        .eq('status', 'ACTIVE');

      if (updateError) throw updateError;

      // Create new active membership
      const { data, error: insertError } = await supabase
        .from('fighter_gym_memberships')
        .insert({
          fighter_id: params.fighterId,
          gym_id: params.toGymId,
          coach_user_id: params.coachUserId || null,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gym-membership', vars.fighterId] });
      queryClient.invalidateQueries({ queryKey: ['gym-fighters'] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard'] });
      toast.success('Peleador transferido exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error en transferencia: ' + error.message);
    },
  });
}
