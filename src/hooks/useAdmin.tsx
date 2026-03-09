import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseAdminReturn {
  isAdmin: boolean | null;
  loading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<void>;
}

/**
 * Hook to check if current user has admin role
 * Uses new role-based system with user_roles table
 * Maintains backward compatibility with existing code
 */
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

      // Check if user has 'admin' or 'super_admin' role in user_roles table
      const { data, error: queryError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin'])
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.error('Error checking admin status:', queryError);
        setError('Error verificando permisos de administrador');
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
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
      return;
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