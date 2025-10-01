import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type DopingTestType = 'PRE_FIGHT' | 'RANDOM' | 'POST_FIGHT' | 'ANNUAL';
export type DopingResultStatus = 'PENDING' | 'CLEAN' | 'POSITIVE' | 'INCONCLUSIVE';

export interface DopingTest {
  id: string;
  license_id: string;
  test_type: DopingTestType;
  test_date: string;
  result_status: DopingResultStatus;
  substances_detected?: string[];
  testing_agency: string;
  report_file_url?: string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DopingEligibility {
  eligible: boolean;
  has_positive_test: boolean;
  months_since_last_test: number;
  latest_test_date?: string;
  reason: string;
}

export function useDopingTests(licenseId: string | null) {
  const [tests, setTests] = useState<DopingTest[]>([]);
  const [eligibility, setEligibility] = useState<DopingEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchTests = async () => {
    if (!licenseId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('doping_tests')
        .select('*')
        .eq('license_id', licenseId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching doping tests:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes de dopaje',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!licenseId) return;

    try {
      const { data, error } = await supabase.rpc('check_doping_eligibility', {
        p_license_id: licenseId,
      });

      if (error) throw error;
      setEligibility(data as unknown as DopingEligibility);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const uploadReport = async (file: File, testData: {
    test_type: DopingTestType;
    test_date: string;
    testing_agency: string;
    notes?: string;
  }) => {
    if (!licenseId) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${licenseId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('doping-reports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('doping-reports')
        .getPublicUrl(fileName);

      // Create doping test record
      const { error: insertError } = await supabase
        .from('doping_tests')
        .insert({
          license_id: licenseId,
          test_type: testData.test_type,
          test_date: testData.test_date,
          testing_agency: testData.testing_agency,
          notes: testData.notes,
          report_file_url: publicUrl,
          result_status: 'PENDING',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Reporte subido',
        description: 'El reporte de dopaje ha sido subido exitosamente',
      });

      await fetchTests();
      await checkEligibility();
    } catch (error) {
      console.error('Error uploading report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el reporte',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchTests();
    checkEligibility();
  }, [licenseId]);

  return {
    tests,
    eligibility,
    loading,
    uploading,
    uploadReport,
    refetch: () => {
      fetchTests();
      checkEligibility();
    },
  };
}
