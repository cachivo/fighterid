import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FighterUpdate {
  id: string;
  fighter_id: string;
  content: string;
  image_url?: string;
  active: boolean;
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

interface CreateUpdateData {
  content: string;
  image_url?: string;
}

interface UpdateUpdateData {
  content?: string;
  image_url?: string;
  active?: boolean;
}

export function useFighterUpdates() {
  const [updates, setUpdates] = useState<FighterUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch updates for a specific fighter
  const fetchFighterUpdates = async (fighterId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fighter_updates')
        .select('*')
        .eq('fighter_id', fighterId)
        .eq('active', true)
        .in('review_status', ['APPROVED', 'PENDING'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUpdates((data || []) as FighterUpdate[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching updates';
      setError(errorMessage);
      console.error('Error fetching fighter updates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new update
  const createUpdate = async (fighterId: string, updateData: CreateUpdateData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fighter_updates')
        .insert({
          fighter_id: fighterId,
          content: updateData.content,
          image_url: updateData.image_url
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new update to the beginning of the list
      setUpdates(prev => [data as FighterUpdate, ...prev]);
      toast.success('Actualización enviada para revisión');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating update';
      setError(errorMessage);
      toast.error('Error al publicar la actualización');
      console.error('Error creating update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing update
  const updateUpdate = async (updateId: string, updateData: UpdateUpdateData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('fighter_updates')
        .update(updateData)
        .eq('id', updateId)
        .select()
        .single();

      if (error) throw error;

      // Update the update in the list
      setUpdates(prev => prev.map(update => 
        update.id === updateId ? (data as FighterUpdate) : update
      ));
      
      toast.success('Actualización editada exitosamente');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating update';
      setError(errorMessage);
      toast.error('Error al editar la actualización');
      console.error('Error updating update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an update (soft delete by setting active to false)
  const deleteUpdate = async (updateId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('fighter_updates')
        .update({ active: false })
        .eq('id', updateId);

      if (error) throw error;

      // Remove the update from the list
      setUpdates(prev => prev.filter(update => update.id !== updateId));
      toast.success('Actualización eliminada exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting update';
      setError(errorMessage);
      toast.error('Error al eliminar la actualización');
      console.error('Error deleting update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get relative time string
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInMinutes > 0) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  };

  return {
    updates,
    loading,
    error,
    fetchFighterUpdates,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    getRelativeTime
  };
}