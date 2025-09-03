import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFighterLicenses(fighterId: string | null) {
  const enabled = !!fighterId;
  const qc = useQueryClient();

  const licenses = useQuery({
    queryKey: ['licenses', fighterId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_licenses')
        .select('*')
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const createLicense = useMutation({
    mutationFn: async (payload: {
      fighter_id: string;
      organization_id?: string | null;
      discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro' | null;
      license_number: string;
      state?: 'active' | 'pending' | 'suspended' | 'expired';
      expires_at?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from('fighter_licenses').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses', fighterId] })
  });

  const updateLicense = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from('fighter_licenses').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses', fighterId] })
  });

  return { licenses, createLicense, updateLicense };
}

export function useOrganizations() {
  const qc = useQueryClient();

  const organizations = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const createOrganization = useMutation({
    mutationFn: async (payload: {
      name: string;
      country?: string;
      short_code?: string;
    }) => {
      const { error } = await supabase.from('organizations').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organizations'] })
  });

  return { organizations, createOrganization };
}