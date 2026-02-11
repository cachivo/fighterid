import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GymDashboardData {
  gym: {
    id: string;
    slug: string;
    nombre: string;
    descripcion: string | null;
    logo_url: string | null;
    banner_url: string | null;
    ciudad: string | null;
    pais: string | null;
    activo: boolean;
  };
  staff: Array<{
    id: string;
    role: string;
    is_primary: boolean;
    user: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      handle: string;
    };
  }>;
  disciplines: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  stats: {
    active_fighters: number;
    total_wins: number;
    total_losses: number;
    total_draws: number;
  };
}

export function useGymDashboard(gymId: string) {
  return useQuery({
    queryKey: ['gym-dashboard', gymId],
    queryFn: async (): Promise<GymDashboardData> => {
      // Fetch gym, staff, disciplines in parallel
      const [gymRes, staffRes, disciplinesRes, membershipsRes] = await Promise.all([
        supabase.from('gyms').select('*').eq('id', gymId).single(),
        supabase
          .from('gym_staff')
          .select('id, role, is_primary, user_id')
          .eq('gym_id', gymId)
          .eq('active', true),
        supabase
          .from('gym_disciplines')
          .select('discipline_id, disciplines(id, name, slug)')
          .eq('gym_id', gymId),
        supabase
          .from('fighter_gym_memberships')
          .select('fighter_id, fighter_profiles(mma_record_wins, mma_record_losses, mma_record_draws)')
          .eq('gym_id', gymId)
          .eq('status', 'ACTIVE'),
      ]);

      if (gymRes.error) throw gymRes.error;

      // Fetch user details for staff
      const staffUserIds = (staffRes.data || []).map((s: any) => s.user_id);
      let staffUsers: any[] = [];
      if (staffUserIds.length > 0) {
        const { data } = await supabase
          .from('app_user')
          .select('id, first_name, last_name, avatar_url, handle')
          .in('id', staffUserIds);
        staffUsers = data || [];
      }

      const staff = (staffRes.data || []).map((s: any) => ({
        id: s.id,
        role: s.role,
        is_primary: s.is_primary,
        user: staffUsers.find((u: any) => u.id === s.user_id) || {
          id: s.user_id, first_name: null, last_name: null, avatar_url: null, handle: 'unknown',
        },
      }));

      const disciplines = (disciplinesRes.data || [])
        .map((d: any) => d.disciplines)
        .filter(Boolean);

      // Calculate stats from memberships
      const fighters = membershipsRes.data || [];
      const stats = {
        active_fighters: fighters.length,
        total_wins: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_wins || 0), 0),
        total_losses: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_losses || 0), 0),
        total_draws: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_draws || 0), 0),
      };

      return { gym: gymRes.data, staff, disciplines, stats };
    },
    enabled: !!gymId,
    staleTime: 60_000,
  });
}
