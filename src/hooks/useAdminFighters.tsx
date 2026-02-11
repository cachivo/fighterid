/**
 * @deprecated Use hooks from `@/hooks/fighters` directly instead.
 * This wrapper maintains backward compatibility.
 */
import { useFightersQuery } from '@/hooks/fighters/useFightersQuery';
import { useAdminUpdateFighter, useDeleteFighterLicense } from '@/hooks/fighters/useFighterMutations';

// Re-export types - AdminFighterProfile is defined locally for backward compat
import type { AdminFighterFormData } from '@/hooks/useFighterProfiles';
export type { AdminFighterFormData };

export interface AdminFighterProfile {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  gym_name?: string;
  bio?: string;
  avatar_url?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  level?: string;
  martial_arts?: string[];
}

export function useAdminFighters() {
  const { data, isLoading, error: queryError, refetch } = useFightersQuery({ active: true });
  const adminUpdate = useAdminUpdateFighter();
  const deleteLicenseMutation = useDeleteFighterLicense();

  const fighters = data?.fighters || [];
  const loading = isLoading;
  const error = queryError?.message || null;

  const fetchFighters = async () => { await refetch(); };

  const updateFighterProfile = async (fighterId: string, profileData: AdminFighterFormData) => {
    try {
      await adminUpdate.mutateAsync({ fighterId, profileData });
      return true;
    } catch {
      return false;
    }
  };

  const deleteLicense = async (licenseId: string) => {
    try {
      await deleteLicenseMutation.mutateAsync(licenseId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    fighters,
    loading,
    error,
    fetchFighters,
    updateFighterProfile,
    deleteLicense,
  };
}
