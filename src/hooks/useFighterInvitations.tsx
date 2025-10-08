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
      const { data, error } = await supabase
        .from('fighter_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error validating token:', error);
      return null;
    }
  };

  const acceptInvitation = async (token: string, fighterProfileId: string) => {
    try {
      const { error } = await supabase
        .from('fighter_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          fighter_profile_id: fighterProfileId,
        })
        .eq('token', token);

      if (error) throw error;
      return true;
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
