import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIConfigItem {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export function useAIConfig() {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [configItems, setConfigItems] = useState<AIConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .order('key');

      if (error) throw error;
      
      const items = (data as AIConfigItem[]) || [];
      setConfigItems(items);
      
      // Crear objeto de config para fácil acceso
      const configObj: Record<string, any> = {};
      items.forEach(item => {
        configObj[item.key] = item.value;
      });
      setConfig(configObj);
    } catch (err) {
      console.error('Error fetching AI config:', err);
      toast({
        title: "Error",
        description: "Error al cargar configuración de IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateConfig = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('ai_config')
        .update({ 
          value, 
          updated_at: new Date().toISOString() 
        })
        .eq('key', key);

      if (error) throw error;

      toast({
        title: "Configuración Actualizada",
        description: `${key} actualizado exitosamente`,
      });

      await fetchConfig();
      return true;
    } catch (err) {
      console.error('Error updating config:', err);
      toast({
        title: "Error",
        description: "Error al actualizar configuración",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getConfigValue = (key: string, defaultValue: any = null) => {
    return config[key] !== undefined ? config[key] : defaultValue;
  };

  return {
    config,
    configItems,
    loading,
    fetchConfig,
    updateConfig,
    getConfigValue,
    // Helper getters para valores comunes
    confidenceThresholdConnected: getConfigValue('confidence_threshold_connected', 0.75),
    confidenceThresholdAttempted: getConfigValue('confidence_threshold_attempted', 0.60),
    debounceWindowMs: getConfigValue('debounce_window_ms', 300),
    maxLatencyMs: getConfigValue('max_latency_ms', 500),
    targetFps: getConfigValue('target_fps', 30),
  };
}