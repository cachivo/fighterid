import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FighterProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  elo_rating: number;
  avatar_url?: string;
  bio?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  license_number?: string;
  license_issued_date?: string;
  license_expires_date?: string;
  license_status?: string;
}

export interface FighterProfileData {
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  bio?: string;
  avatar_url?: string;
}

export function useFighterProfiles() {
  const [fighters, setFighters] = useState<FighterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFighters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select(`
          *,
        license_number,
        license_issued_date,
        license_expires_date,
        license_status
        `)
        .eq('active', true)
        .order('elo_rating', { ascending: false });

      if (error) throw error;
      setFighters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createFighterProfile = async (profileData: FighterProfileData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // Get user_id from app_user table
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;
      if (!appUser) throw new Error('Perfil de usuario no encontrado');

      const { data, error } = await supabase
        .from('fighter_profiles')
        .insert({
          user_id: appUser.id,
          ...profileData
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh fighters list
      await fetchFighters();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateFighterProfile = async (id: string, profileData: Partial<FighterProfileData>) => {
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh fighters list
      await fetchFighters();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const getUserFighterProfile = async () => {
    if (!user) return null;

    try {
      // Get user_id from app_user table
      const { data: appUser, error: userError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !appUser) return null;

      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('*')
        .eq('user_id', appUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user fighter profile:', err);
      return null;
    }
  };

  const getFighterById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  useEffect(() => {
    fetchFighters();
  }, []);

  return {
    fighters,
    loading,
    error,
    createFighterProfile,
    updateFighterProfile,
    getUserFighterProfile,
    getFighterById,
    refreshFighters: fetchFighters
  };
}