import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FighterInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  weight_class?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  fighter_profile_id?: string;
}

export function useFighterInvitations() {
  const [invitations, setInvitations] = useState<FighterInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fighter_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data as FighterInvitation[] || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      // Use secure RPC function instead of direct query
      const { data, error } = await supabase
        .rpc('validate_fighter_invitation', { p_token: token });

      if (error) throw error;
      
      // Return first result if array, or null if empty
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Error validating token:', error);
      return null;
    }
  };

  const acceptInvitation = async (token: string, fighterProfileId: string) => {
    try {
      // Use secure RPC function instead of direct update
      const { data, error } = await supabase
        .rpc('accept_fighter_invitation', { 
          p_token: token,
          p_fighter_profile_id: fighterProfileId 
        });

      if (error) throw error;
      return data === true;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    validateToken,
    acceptInvitation,
  };
}
