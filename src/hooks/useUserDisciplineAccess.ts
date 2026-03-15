import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export type Discipline = 'MMA' | 'Boxeo';

/**
 * Returns the disciplines the current user is allowed to manage.
 * Admins and super_admins bypass the filter and get all disciplines.
 */
export function useUserDisciplineAccess() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useUserRole();

  const query = useQuery<Discipline[]>({
    queryKey: ['user-discipline-access', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_discipline_access')
        .select('discipline')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching discipline access:', error);
        return [];
      }

      return (data || []).map(d => d.discipline as Discipline);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Admins/super_admins see everything
  const hasFullAccess = isAdmin || isSuperAdmin;
  const disciplines = hasFullAccess ? ['MMA', 'Boxeo'] as Discipline[] : (query.data || []);

  return {
    disciplines,
    hasFullAccess,
    hasMMA: hasFullAccess || disciplines.includes('MMA'),
    hasBoxeo: hasFullAccess || disciplines.includes('Boxeo'),
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * Fetches discipline access for a specific user (admin use in RoleEditDialog).
 */
export function useUserDisciplineAccessById(userId: string | undefined) {
  return useQuery<Discipline[]>({
    queryKey: ['user-discipline-access', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_discipline_access')
        .select('discipline')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching discipline access for user:', error);
        return [];
      }

      return (data || []).map(d => d.discipline as Discipline);
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
