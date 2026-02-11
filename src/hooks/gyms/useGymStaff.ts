import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GymStaffMember {
  id: string;
  gym_id: string;
  user_id: string;
  role: 'OWNER' | 'HEAD_COACH' | 'ASSISTANT_COACH';
  is_primary: boolean;
  active: boolean;
  created_at: string;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    handle: string;
    email: string | null;
  };
}

export function useGymStaff(gymId: string) {
  return useQuery({
    queryKey: ['gym-staff', gymId],
    queryFn: async (): Promise<GymStaffMember[]> => {
      const { data, error } = await supabase
        .from('gym_staff')
        .select('*')
        .eq('gym_id', gymId)
        .eq('active', true)
        .order('created_at');

      if (error) throw error;

      // Fetch user details
      const userIds = (data || []).map((s: any) => s.user_id);
      if (userIds.length === 0) return [];

      const { data: users } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, avatar_url, handle, email')
        .in('id', userIds);

      return (data || []).map((s: any) => ({
        ...s,
        user: (users || []).find((u: any) => u.id === s.user_id),
      }));
    },
    enabled: !!gymId,
    staleTime: 60_000,
  });
}

export function useAddGymStaff(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; role: 'OWNER' | 'HEAD_COACH' | 'ASSISTANT_COACH'; isPrimary?: boolean }) => {
      const { data, error } = await supabase
        .from('gym_staff')
        .insert({
          gym_id: gymId,
          user_id: params.userId,
          role: params.role,
          is_primary: params.isPrimary || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-staff', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard', gymId] });
      toast.success('Staff agregado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al agregar staff: ' + error.message);
    },
  });
}

export function useRemoveGymStaff(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('gym_staff')
        .update({ active: false })
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-staff', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard', gymId] });
      toast.success('Staff removido');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
}
