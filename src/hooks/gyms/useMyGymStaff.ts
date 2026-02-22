import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MyGymStaffResult {
  gymId: string;
  gymName: string;
  gymSlug: string | null;
  gymLogoUrl: string | null;
  role: 'OWNER' | 'HEAD_COACH' | 'ASSISTANT_COACH';
  staffId: string;
}

/**
 * Detecta si el usuario autenticado es staff activo de algún gimnasio.
 * Usa gym_staff como única fuente de verdad (NO duplica roles en app_role).
 * 
 * Flujo: auth.uid() → app_user.id → gym_staff.user_id
 */
export function useMyGymStaff() {
  const { user } = useAuth();

  return useQuery<MyGymStaffResult | null>({
    queryKey: ['my-gym-staff', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Mapear auth.uid() → app_user.id
      const { data: appUser, error: appError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (appError || !appUser) return null;

      // 2. Buscar gym_staff activo para este usuario
      const { data: staffRecord, error: staffError } = await supabase
        .from('gym_staff')
        .select('id, gym_id, role, gyms(id, nombre, slug, logo_url)')
        .eq('user_id', appUser.id)
        .eq('active', true)
        .maybeSingle();

      if (staffError || !staffRecord) return null;

      const gym = staffRecord.gyms as any;
      if (!gym) return null;

      return {
        gymId: gym.id,
        gymName: gym.nombre,
        gymSlug: gym.slug,
        gymLogoUrl: gym.logo_url,
        role: staffRecord.role as MyGymStaffResult['role'],
        staffId: staffRecord.id,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min - no cambia frecuentemente
  });
}

/**
 * Hook para verificar permisos de staff en un gimnasio específico.
 * Retorna el rol del usuario en ese gimnasio o null si no es staff.
 */
export function useGymStaffRole(gymId: string) {
  const { user } = useAuth();

  return useQuery<{ role: string; canManageFighters: boolean; canEditGymProfile: boolean; canManageStaff: boolean } | null>({
    queryKey: ['gym-staff-role', gymId, user?.id],
    queryFn: async () => {
      if (!user || !gymId) return null;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!appUser) return null;

      const { data: staffRecord } = await supabase
        .from('gym_staff')
        .select('role')
        .eq('user_id', appUser.id)
        .eq('gym_id', gymId)
        .eq('active', true)
        .maybeSingle();

      if (!staffRecord) return null;

      return {
        role: staffRecord.role,
        canManageFighters: staffRecord.role === 'OWNER' || staffRecord.role === 'HEAD_COACH',
        canEditGymProfile: staffRecord.role === 'OWNER',
        canManageStaff: staffRecord.role === 'OWNER',
      };
    },
    enabled: !!user && !!gymId,
    staleTime: 5 * 60 * 1000,
  });
}
