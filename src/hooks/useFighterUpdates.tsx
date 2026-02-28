import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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

export interface GymFighterUpdate extends FighterUpdate {
  fighter_name: string;
  fighter_avatar: string | null;
  fighter_nickname: string | null;
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
  const [gymUpdates, setGymUpdates] = useState<GymFighterUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upload image to Supabase Storage
  const uploadUpdateImage = async (file: File, fighterId: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${fighterId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('fighter-update-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('fighter-update-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

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

  // Fetch updates for all fighters in a gym
  const fetchGymFighterUpdates = async (gymId: string, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      // Use a raw query via RPC or manual join
      const { data, error } = await supabase
        .from('fighter_updates')
        .select(`
          *,
          fighter_profiles!inner (
            id,
            first_name,
            last_name,
            nickname,
            avatar_url,
            gym_memberships!inner (
              gym_id,
              status
            )
          )
        `)
        .eq('active', true)
        .in('review_status', ['APPROVED', 'PENDING'])
        .eq('fighter_profiles.gym_memberships.gym_id', gymId)
        .eq('fighter_profiles.gym_memberships.status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped: GymFighterUpdate[] = (data || []).map((item: any) => ({
        id: item.id,
        fighter_id: item.fighter_id,
        content: item.content,
        image_url: item.image_url,
        active: item.active,
        review_status: item.review_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        fighter_name: `${item.fighter_profiles?.first_name || ''} ${item.fighter_profiles?.last_name || ''}`.trim(),
        fighter_avatar: item.fighter_profiles?.avatar_url || null,
        fighter_nickname: item.fighter_profiles?.nickname || null,
      }));

      setGymUpdates(mapped);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching gym updates';
      setError(errorMessage);
      console.error('Error fetching gym fighter updates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new update (with optional file upload)
  const createUpdate = async (fighterId: string, updateData: CreateUpdateData, imageFile?: File) => {
    try {
      setLoading(true);
      setError(null);

      let imageUrl = updateData.image_url;

      // Upload image if file provided
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadUpdateImage(imageFile, fighterId);
        setUploading(false);
      }

      const { data, error } = await supabase
        .from('fighter_updates')
        .insert({
          fighter_id: fighterId,
          content: updateData.content,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      setUpdates(prev => [data as FighterUpdate, ...prev]);
      toast.success('Actualización publicada exitosamente');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating update';
      setError(errorMessage);
      setUploading(false);
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

  // Delete an update (soft delete)
  const deleteUpdate = async (updateId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('fighter_updates')
        .update({ active: false })
        .eq('id', updateId);

      if (error) throw error;

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
    gymUpdates,
    loading,
    uploading,
    error,
    fetchFighterUpdates,
    fetchGymFighterUpdates,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    getRelativeTime
  };
}
