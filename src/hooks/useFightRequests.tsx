import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppUserId } from './useAppUserId';

export interface FightRequest {
  id: string;
  event_id: string | null;
  requested_by: string;
  gym_id: string | null;
  fighter_a_id: string | null;
  fighter_a_name: string | null;
  fighter_b_id: string | null;
  fighter_b_name: string | null;
  opponent_gym_id: string | null;
  discipline: string;
  weight_class: string;
  fight_type: string;
  number_of_rounds: number | null;
  is_championship: boolean | null;
  status: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  eligibility_check: any;
  fight_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FightRequestWithDetails extends FightRequest {
  fighter_a?: { id: string; first_name: string; last_name: string; nickname: string | null; weight_class: string; avatar_url: string | null } | null;
  fighter_b?: { id: string; first_name: string; last_name: string; nickname: string | null; weight_class: string; avatar_url: string | null } | null;
  gym?: { id: string; nombre: string } | null;
  event?: { id: string; name: string; start_time: string | null } | null;
}

export function useFightRequests(statusFilter?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['fight-requests', statusFilter],
    queryFn: async (): Promise<FightRequestWithDetails[]> => {
      let q = supabase
        .from('fight_requests')
        .select(`
          *,
          fighter_a:fighter_profiles!fight_requests_fighter_a_id_fkey(id, first_name, last_name, nickname, weight_class, avatar_url),
          fighter_b:fighter_profiles!fight_requests_fighter_b_id_fkey(id, first_name, last_name, nickname, weight_class, avatar_url),
          gym:gyms!fight_requests_gym_id_fkey(id, nombre),
          event:bdg_event!fight_requests_event_id_fkey(id, name, start_time)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        q = q.eq('status', statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as FightRequestWithDetails[];
    },
    staleTime: 30_000,
  });

  const createRequest = useMutation({
    mutationFn: async (input: Partial<FightRequest>) => {
      const { data, error } = await supabase
        .from('fight_requests')
        .insert([input as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fight-requests'] });
      toast.success('Solicitud de pelea creada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const submitRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fight_requests')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fight-requests'] });
      toast.success('Solicitud enviada para revisión');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewRequest = useMutation({
    mutationFn: async ({ id, action, reason, reviewerId }: { id: string; action: 'approved' | 'rejected'; reason?: string; reviewerId: string }) => {
      const { error } = await supabase
        .from('fight_requests')
        .update({
          status: action,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: action === 'rejected' ? reason : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['fight-requests'] });
      toast.success(vars.action === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const validateEligibility = async (fighterAId: string, fighterBId: string, weightClass?: string) => {
    const { data, error } = await supabase.rpc('validate_fight_eligibility', {
      p_fighter_a_id: fighterAId,
      p_fighter_b_id: fighterBId,
      p_weight_class: weightClass || null,
    });
    if (error) throw error;
    return data as any;
  };

  return {
    requests: query.data || [],
    loading: query.isLoading,
    error: query.error,
    createRequest: createRequest.mutateAsync,
    submitRequest: submitRequest.mutateAsync,
    reviewRequest: reviewRequest.mutateAsync,
    validateEligibility,
    refetch: query.refetch,
  };
}
