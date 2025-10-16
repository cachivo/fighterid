import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExternalFighter {
  id: string;
  name: string;
  nickname?: string;
  image_url?: string;
  weight_class?: string;
  record?: {
    wins: number;
    losses: number;
    draws: number;
  };
  gym?: string;
  country?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalFighterFormData {
  name: string;
  nickname?: string;
  weight_class: string;
  gym?: string;
  country?: string;
  record?: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export const useExternalFighters = () => {
  const [externalFighters, setExternalFighters] = useState<ExternalFighter[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExternalFighters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('external_fighters')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Map the data to proper type
      const mappedData: ExternalFighter[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        nickname: item.nickname,
        image_url: item.image_url,
        weight_class: item.weight_class,
        record: item.record as { wins: number; losses: number; draws: number },
        gym: item.gym,
        country: item.country,
        metadata: item.metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setExternalFighters(mappedData);
    } catch (error: any) {
      console.error('Error fetching external fighters:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los peleadores externos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createExternalFighter = async (
    formData: ExternalFighterFormData,
    imageFile?: File
  ): Promise<string | null> => {
    try {
      setLoading(true);

      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('external-fighter-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('external-fighter-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Create external fighter record
      const { data, error } = await supabase
        .from('external_fighters')
        .insert({
          name: formData.name,
          nickname: formData.nickname || null,
          weight_class: formData.weight_class,
          gym: formData.gym || null,
          country: formData.country || 'HN',
          record: formData.record || { wins: 0, losses: 0, draws: 0 },
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Peleador externo creado correctamente',
      });

      await fetchExternalFighters();
      return data.id;
    } catch (error: any) {
      console.error('Error creating external fighter:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el peleador externo',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchExternalFighters = (query: string): ExternalFighter[] => {
    if (!query) return externalFighters;
    
    const lowerQuery = query.toLowerCase();
    return externalFighters.filter(
      (fighter) =>
        fighter.name.toLowerCase().includes(lowerQuery) ||
        fighter.nickname?.toLowerCase().includes(lowerQuery) ||
        fighter.gym?.toLowerCase().includes(lowerQuery)
    );
  };

  useEffect(() => {
    fetchExternalFighters();
  }, []);

  return {
    externalFighters,
    loading,
    createExternalFighter,
    searchExternalFighters,
    refreshExternalFighters: fetchExternalFighters,
  };
};
