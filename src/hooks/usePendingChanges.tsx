import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingProfileChange {
  id: string;
  fighter_profile_id: string;
  user_id: string;
  requested_changes: any;
  status: string;
  admin_notes?: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  fighter_profiles?: {
    first_name: string;
    last_name: string;
    nickname?: string;
    avatar_url?: string;
  };
}

export interface PendingFighterUpdate {
  id: string;
  fighter_id: string;
  content: string;
  image_url?: string;
  review_status: string;
  created_at: string;
  fighter_profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface PendingDopingTest {
  id: string;
  license_id: string;
  test_type: string;
  test_date: string;
  result_status: string;
  testing_agency: string;
  report_file_url?: string;
  created_at: string;
  fighter_licenses?: {
    fighter_profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

export type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_INFO';

export function usePendingChanges() {
  const [profileChanges, setProfileChanges] = useState<PendingProfileChange[]>([]);
  const [allProfileChanges, setAllProfileChanges] = useState<PendingProfileChange[]>([]);
  const [fighterUpdates, setFighterUpdates] = useState<PendingFighterUpdate[]>([]);
  const [allFighterUpdates, setAllFighterUpdates] = useState<PendingFighterUpdate[]>([]);
  const [dopingTests, setDopingTests] = useState<PendingDopingTest[]>([]);
  const [allDopingTests, setAllDopingTests] = useState<PendingDopingTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');

  // Fetch all profile changes (for stats and filtered view)
  const fetchProfileChanges = async (filterStatus?: StatusFilter) => {
    try {
      setLoading(true);
      let query = supabase
        .from('profile_change_requests')
        .select(`
          *,
          fighter_profiles (
            first_name,
            last_name,
            nickname,
            avatar_url,
            record_wins,
            record_losses,
            record_draws,
            record_type
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch all for stats
      const { data: allData, error: allError } = await query;
      if (allError) throw allError;
      setAllProfileChanges(allData || []);

      // Filter based on status
      const currentFilter = filterStatus || statusFilter;
      if (currentFilter === 'ALL') {
        setProfileChanges(allData || []);
      } else {
        setProfileChanges((allData || []).filter(item => item.status === currentFilter));
      }
    } catch (err) {
      console.error('Error fetching profile changes:', err);
      setError(err instanceof Error ? err.message : 'Error fetching profile changes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all fighter updates
  const fetchFighterUpdates = async (filterStatus?: StatusFilter) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fighter_updates')
        .select(`
          *,
          fighter_profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllFighterUpdates(data || []);

      const currentFilter = filterStatus || statusFilter;
      if (currentFilter === 'ALL') {
        setFighterUpdates(data || []);
      } else {
        setFighterUpdates((data || []).filter(item => item.review_status === currentFilter));
      }
    } catch (err) {
      console.error('Error fetching fighter updates:', err);
      setError(err instanceof Error ? err.message : 'Error fetching fighter updates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all doping tests
  const fetchDopingTests = async (filterStatus?: StatusFilter) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doping_tests')
        .select(`
          *,
          fighter_licenses (
            fighter_profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllDopingTests(data || []);

      const currentFilter = filterStatus || statusFilter;
      if (currentFilter === 'ALL') {
        setDopingTests(data || []);
      } else {
        setDopingTests((data || []).filter(item => item.result_status === currentFilter));
      }
    } catch (err) {
      console.error('Error fetching doping tests:', err);
      setError(err instanceof Error ? err.message : 'Error fetching doping tests');
    } finally {
      setLoading(false);
    }
  };

  // Apply filter to all data types
  const applyStatusFilter = (newFilter: StatusFilter) => {
    setStatusFilter(newFilter);
    fetchProfileChanges(newFilter);
    fetchFighterUpdates(newFilter);
    fetchDopingTests(newFilter);
  };

  // Approve/Reject/Request Info for profile change
  const updateProfileChangeStatus = async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'REQUIRES_INFO',
    adminNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, apply changes via RPC
      if (status === 'APPROVED') {
        const change = profileChanges.find(c => c.id === requestId);
        if (change) {
          const { error: applyError } = await supabase.rpc('admin_update_fighter_profile', {
            p_fighter_id: change.fighter_profile_id,
            p_profile_data: change.requested_changes
          });

          if (applyError) throw applyError;
        }
      }

      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} exitosamente`);
      await fetchProfileChanges();
    } catch (err) {
      console.error('Error updating profile change:', err);
      toast.error('Error al procesar la solicitud');
      throw err;
    }
  };

  // Moderate fighter update
  const moderateFighterUpdate = async (
    updateId: string,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('moderate_fighter_update', {
        p_update_id: updateId,
        p_new_status: status,
        p_admin_notes: adminNotes
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result && !result.success) throw new Error(result.error);

      toast.success(`Actualización ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}`);
      await fetchFighterUpdates();
    } catch (err) {
      console.error('Error moderating update:', err);
      toast.error('Error al moderar la actualización');
      throw err;
    }
  };

  // Verify doping test
  const verifyDopingTest = async (
    testId: string,
    resultStatus: 'CLEAN' | 'POSITIVE',
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('doping_tests')
        .update({
          result_status: resultStatus,
          notes,
          verified_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) throw error;

      toast.success('Test de dopaje verificado');
      await fetchDopingTests();
    } catch (err) {
      console.error('Error verifying doping test:', err);
      toast.error('Error al verificar el test');
      throw err;
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('pending-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profile_change_requests' },
        () => {
          fetchProfileChanges();
          toast.info('Nueva solicitud de cambio de perfil');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fighter_updates' },
        () => {
          fetchFighterUpdates();
          toast.info('Nueva actualización de peleador');
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doping_tests' },
        () => {
          fetchDopingTests();
          toast.info('Nuevo test de dopaje');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfileChanges();
    fetchFighterUpdates();
    fetchDopingTests();
  }, []);

  // Stats calculations
  const stats = {
    total: allProfileChanges.length + allFighterUpdates.length + allDopingTests.length,
    pending: allProfileChanges.filter(p => p.status === 'PENDING').length +
             allFighterUpdates.filter(u => u.review_status === 'PENDING').length +
             allDopingTests.filter(d => d.result_status === 'PENDING').length,
    approved: allProfileChanges.filter(p => p.status === 'APPROVED' || p.status === 'APPLIED').length +
              allFighterUpdates.filter(u => u.review_status === 'APPROVED').length +
              allDopingTests.filter(d => d.result_status === 'CLEAN').length,
    rejected: allProfileChanges.filter(p => p.status === 'REJECTED').length +
              allFighterUpdates.filter(u => u.review_status === 'REJECTED').length +
              allDopingTests.filter(d => d.result_status === 'POSITIVE').length,
    requiresInfo: allProfileChanges.filter(p => p.status === 'REQUIRES_INFO').length,
    profileStats: {
      total: allProfileChanges.length,
      pending: allProfileChanges.filter(p => p.status === 'PENDING').length,
      approved: allProfileChanges.filter(p => p.status === 'APPROVED' || p.status === 'APPLIED').length,
      rejected: allProfileChanges.filter(p => p.status === 'REJECTED').length,
      requiresInfo: allProfileChanges.filter(p => p.status === 'REQUIRES_INFO').length,
    },
    updateStats: {
      total: allFighterUpdates.length,
      pending: allFighterUpdates.filter(u => u.review_status === 'PENDING').length,
      approved: allFighterUpdates.filter(u => u.review_status === 'APPROVED').length,
      rejected: allFighterUpdates.filter(u => u.review_status === 'REJECTED').length,
    },
    dopingStats: {
      total: allDopingTests.length,
      pending: allDopingTests.filter(d => d.result_status === 'PENDING').length,
      clean: allDopingTests.filter(d => d.result_status === 'CLEAN').length,
      positive: allDopingTests.filter(d => d.result_status === 'POSITIVE').length,
    }
  };

  return {
    profileChanges,
    allProfileChanges,
    fighterUpdates,
    allFighterUpdates,
    dopingTests,
    allDopingTests,
    loading,
    error,
    statusFilter,
    stats,
    fetchProfileChanges,
    fetchFighterUpdates,
    fetchDopingTests,
    applyStatusFilter,
    updateProfileChangeStatus,
    moderateFighterUpdate,
    verifyDopingTest,
    totalPending: stats.pending
  };
}
