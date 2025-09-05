import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseAdminReturn {
  isAdmin: boolean | null;
  loading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<void>;
}

export function useAdmin(): UseAdminReturn {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('app_user')
        .select('is_admin')
        .eq('auth_user_id', user.id)
        .single();

      if (queryError) {
        console.error('Error checking admin status:', queryError);
        setError('Error verificando permisos de administrador');
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      setError('Error verificando permisos de administrador');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to complete
    }

    checkAdminStatus();
  }, [user, authLoading]);

  return {
    isAdmin,
    loading: loading || authLoading,
    error,
    checkAdminStatus,
  };
}