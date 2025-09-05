import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ProfileChangeRequest {
  id: string;
  user_id: string;
  fighter_profile_id: string;
  requested_changes: any;
  status: string;
  admin_notes?: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  updated_at: string;
  fighter_profiles?: {
    first_name: string;
    last_name: string;
    user_id?: string;
  };
  app_user?: {
    email: string;
  };
}

export interface ChangeRequestAudit {
  id: string;
  request_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  performed_by?: string;
  performed_at: string;
}

export function useProfileChangeRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          fighter_profiles!inner (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching change requests:', fetchError);
        setError('Error al cargar las solicitudes');
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error('Error in fetchUserRequests:', err);
      setError('Error inesperado al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const createChangeRequest = async (fighterProfileId: string, requestedChanges: any) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // First get the user's app_user record
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !appUser) {
        throw new Error('Usuario no encontrado');
      }

      const { data, error } = await supabase
        .from('profile_change_requests')
        .insert({
          user_id: appUser.id,
          fighter_profile_id: fighterProfileId,
          requested_changes: requestedChanges,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating change request:', error);
        throw new Error('Error al crear la solicitud de cambio');
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de cambio ha sido enviada para revisión administrativa.",
      });

      await fetchUserRequests(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error in createChangeRequest:', err);
      throw err;
    }
  };

  // Admin functions
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          fighter_profiles!inner (
            first_name,
            last_name,
            user_id
          ),
          app_user!profile_change_requests_reviewed_by_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching all change requests:', fetchError);
        setError('Error al cargar las solicitudes');
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error('Error in fetchAllRequests:', err);
      setError('Error inesperado al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string, 
    status: string, 
    adminNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.from('app_user').select('id').eq('auth_user_id', user?.id).single()).data?.id
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        throw new Error('Error al actualizar el estado de la solicitud');
      }

      // If approved, apply the changes to the fighter profile
      if (status === 'APPROVED') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await applyProfileChanges(request.fighter_profile_id, request.requested_changes);
        }
      }

      toast({
        title: "Solicitud actualizada",
        description: `La solicitud ha sido ${status === 'APPROVED' ? 'aprobada' : status === 'REJECTED' ? 'rechazada' : 'marcada como requiere información'}.`,
      });

      await fetchAllRequests(); // Refresh the list
    } catch (err) {
      console.error('Error in updateRequestStatus:', err);
      throw err;
    }
  };

  const applyProfileChanges = async (fighterProfileId: string, changes: any) => {
    try {
      // Get current app user for admin check
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!appUser) {
        throw new Error('Usuario admin no encontrado');
      }

      // Use the admin update function
      const { error } = await supabase.rpc('admin_update_fighter_profile_v2', {
        p_fighter_id: fighterProfileId,
        p_profile_data: changes,
        p_admin_user_id: appUser.id
      });

      if (error) {
        console.error('Error applying profile changes:', error);
        throw new Error('Error al aplicar los cambios al perfil');
      }
    } catch (err) {
      console.error('Error in applyProfileChanges:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  return {
    requests,
    loading,
    error,
    fetchUserRequests,
    createChangeRequest,
    fetchAllRequests,
    updateRequestStatus
  };
}