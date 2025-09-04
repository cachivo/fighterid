import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSystemStatus() {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const { error } = await supabase.from('app_user').select('id').limit(1);
        setDbConnected(!error);
      } catch {
        setDbConnected(false);
      }
    };

    checkDbConnection();
    const interval = setInterval(checkDbConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update timestamp every minute

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdate = () => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes === 1) return 'Hace 1 min';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    return `Hace ${diffHours} horas`;
  };

  return {
    dbConnected,
    authActive: !!user,
    lastUpdate: formatLastUpdate(),
  };
}