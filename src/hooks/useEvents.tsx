import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BdgEvent {
  id: string;
  name: string;
  description?: string;
  discipline: string;
  venue?: string;
  state: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  meta: any;
}

export interface Fight {
  id: string;
  event_id: string;
  fight_number: number;
  fight_type: string;
  fighter_a_id: string;
  fighter_b_id: string;
  weight_class: string;
  scheduled_time?: string;
  status: string;
  winner_id?: string;
  finish_method?: string;
  finish_round?: number;
  finish_time?: string;
  created_at: string;
  updated_at: string;
  fighter_a?: any;
  fighter_b?: any;
}

export function useEvents() {
  const [events, setEvents] = useState<BdgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bdg_event')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    name: string;
    description?: string;
    discipline: string;
    venue?: string;
    start_time?: string;
    end_time?: string;
  }) => {
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
        .from('bdg_event')
        .insert({
          ...eventData,
          created_by: appUser.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchEvents();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  const updateEventState = async (eventId: string, state: string) => {
    try {
      const { error } = await supabase
        .from('bdg_event')
        .update({ state })
        .eq('id', eventId);

      if (error) throw error;
      await fetchEvents();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEventState,
    refreshEvents: fetchEvents
  };
}

export function useFights(eventId?: string) {
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFights = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('fights')
        .select(`
          *,
          fighter_a:fighter_profiles!fights_fighter_a_id_fkey(*),
          fighter_b:fighter_profiles!fights_fighter_b_id_fkey(*)
        `)
        .order('fight_number', { ascending: true });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFights(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createFight = async (fightData: {
    event_id: string;
    fight_number: number;
    fight_type: string;
    fighter_a_id: string;
    fighter_b_id: string;
    weight_class: string;
    scheduled_time?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('fights')
        .insert(fightData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchFights();
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido');
    }
  };

  useEffect(() => {
    fetchFights();
  }, [eventId]);

  return {
    fights,
    loading,
    error,
    createFight,
    refreshFights: fetchFights
  };
}