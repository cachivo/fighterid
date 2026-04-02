import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Sanction {
  id: string;
  target_type: 'fighter' | 'coach' | 'official' | 'gym' | 'organization';
  target_id: string;
  sanction_type: 'suspension' | 'fine' | 'warning' | 'license_revocation' | 'ban';
  severity: number;
  reason: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  fine_amount: number | null;
  fine_paid: boolean;
  status: 'open' | 'under_review' | 'decided' | 'appealed' | 'closed';
  evidence_urls: string[] | null;
  related_fight_id: string | null;
  related_event_id: string | null;
  issued_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  notes: string | null;
  discipline: string | null;
  created_at: string;
  updated_at: string;
}

export interface SanctionAppeal {
  id: string;
  sanction_id: string;
  appealed_by: string;
  reason: string;
  evidence_urls: string[] | null;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  decision_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSanctionInput {
  target_type: Sanction['target_type'];
  target_id: string;
  sanction_type: Sanction['sanction_type'];
  severity: number;
  reason: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  fine_amount?: number;
  evidence_urls?: string[];
  related_fight_id?: string;
  related_event_id?: string;
  notes?: string;
}

export function useSanctions() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSanctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('sanctions')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setSanctions((data || []) as Sanction[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSanctions(); }, [fetchSanctions]);

  const createSanction = async (input: CreateSanctionInput) => {
    const { data, error: err } = await supabase
      .from('sanctions')
      .insert({
        ...input,
        issued_by: user?.id,
      })
      .select()
      .single();
    if (err) throw err;
    await fetchSanctions();
    return data;
  };

  const updateSanctionStatus = async (id: string, status: Sanction['status'], notes?: string) => {
    const updates: Record<string, any> = { status };
    if (notes) updates.notes = notes;
    if (status === 'decided' || status === 'closed') {
      updates.decided_by = user?.id;
      updates.decided_at = new Date().toISOString();
    }
    const { error: err } = await supabase.from('sanctions').update(updates).eq('id', id);
    if (err) throw err;
    await fetchSanctions();
  };

  const deleteSanction = async (id: string) => {
    const { error: err } = await supabase.from('sanctions').delete().eq('id', id);
    if (err) throw err;
    await fetchSanctions();
  };

  return { sanctions, loading, error, refetch: fetchSanctions, createSanction, updateSanctionStatus, deleteSanction };
}

export function useSanctionAppeals(sanctionId?: string) {
  const [appeals, setAppeals] = useState<SanctionAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAppeals = useCallback(async () => {
    if (!sanctionId) { setAppeals([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('sanction_appeals')
      .select('*')
      .eq('sanction_id', sanctionId)
      .order('created_at', { ascending: false });
    setAppeals((data || []) as SanctionAppeal[]);
    setLoading(false);
  }, [sanctionId]);

  useEffect(() => { fetchAppeals(); }, [fetchAppeals]);

  const createAppeal = async (reason: string, evidenceUrls?: string[]) => {
    if (!sanctionId || !user) throw new Error('Missing sanction or user');
    const { error: err } = await supabase.from('sanction_appeals').insert({
      sanction_id: sanctionId,
      appealed_by: user.id,
      reason,
      evidence_urls: evidenceUrls || [],
    });
    if (err) throw err;
    await fetchAppeals();
  };

  const updateAppealStatus = async (appealId: string, status: SanctionAppeal['status'], decisionNotes?: string) => {
    const updates: Record<string, any> = { status };
    if (decisionNotes) updates.decision_notes = decisionNotes;
    if (status === 'accepted' || status === 'rejected') {
      updates.decided_by = user?.id;
      updates.decided_at = new Date().toISOString();
    }
    const { error: err } = await supabase.from('sanction_appeals').update(updates).eq('id', appealId);
    if (err) throw err;
    await fetchAppeals();
  };

  return { appeals, loading, refetch: fetchAppeals, createAppeal, updateAppealStatus };
}
