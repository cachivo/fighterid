import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface LicenseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasActiveLicense: boolean;
  licenseData: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshLicense: () => Promise<void>;
}

const LicenseAuthContext = createContext<LicenseAuthContextType | undefined>(undefined);

export const LicenseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [licenseData, setLicenseData] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const checkLicenseStatus = async (userId: string) => {
    try {
      console.log('Checking license status for user:', userId);
      
      // Set a shorter timeout for better UX
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('License check timeout')), 5000)
      );

      // Step 1: Get app_user data
      const userPromise = supabase
        .from('app_user')
        .select('id, email, is_admin')
        .eq('auth_user_id', userId)
        .maybeSingle();

      const userResult = await Promise.race([userPromise, timeoutPromise]) as any;
      const { data: userData, error: userError } = userResult;
      
      if (userError) {
        console.error('User query error:', userError.message);
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      if (!userData) {
        console.log('No app user found');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      console.log('App user found:', userData);

      // Step 2: Get fighter profile
      const profilePromise = supabase
        .from('fighter_profiles')
        .select(`
          id,
          first_name,
          last_name,
          nickname,
          country,
          weight_class,
          avatar_url,
          record_wins,
          record_losses,
          record_draws,
          discipline,
          active
        `)
        .eq('user_id', userData.id)
        .eq('active', true)
        .maybeSingle();

      const profileResult = await Promise.race([profilePromise, timeoutPromise]) as any;
      const { data: profileData, error: profileError } = profileResult;
      
      if (profileError) {
        console.error('Profile query error:', profileError.message);
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      if (!profileData) {
        console.log('No fighter profile found');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      console.log('Fighter profile found:', profileData);

      // Step 3: Get licenses for this fighter
      const licensePromise = supabase
        .from('fighter_licenses')
        .select(`
          id,
          license_number,
          status,
          license_level,
          issued_at,
          expires_at,
          suspension_reason,
          suspension_until,
          is_primary
        `)
        .eq('fighter_id', profileData.id)
        .order('created_at', { ascending: false });

      const licenseResult = await Promise.race([licensePromise, timeoutPromise]) as any;
      const { data: licensesData, error: licenseError } = licenseResult;
      
      if (licenseError) {
        console.error('License query error:', licenseError.message);
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      console.log('Licenses found:', licensesData);

      if (!licensesData || licensesData.length === 0) {
        console.log('No licenses found for fighter');
        setLicenseData(null);
        setHasActiveLicense(false);
        return;
      }

      // Find primary license or most recent license
      const primaryLicense = licensesData.find((l: any) => l.is_primary) || licensesData[0];

      console.log('Primary license found:', primaryLicense);
      console.log('Primary license status:', primaryLicense.status);
      
      // Combine all data
      const combinedLicenseData = {
        ...primaryLicense,
        fighter_profiles: profileData
      };

      setLicenseData(combinedLicenseData);
      const isActive = primaryLicense.status === 'ACTIVE';
      console.log('License is active:', isActive);
      setHasActiveLicense(isActive);
      
      // Invalidate relevant queries when license status changes
      queryClient.invalidateQueries({ queryKey: ['license'] });
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });

    } catch (error) {
      console.error('Error checking license status:', error);
      
      // Fallback: Try direct license check
      try {
        console.log('Attempting fallback license check...');
        const fallbackResult = await supabase
          .from('fighter_licenses')
          .select(`
            id,
            status,
            license_number,
            license_level,
            issued_at,
            expires_at,
            fighter_profiles!inner (
              id,
              first_name,
              last_name,
              nickname,
              user_id
            )
          `)
          .eq('fighter_profiles.user_id', (await supabase.from('app_user').select('id').eq('auth_user_id', userId).single()).data?.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (fallbackResult.data && fallbackResult.data.status === 'ACTIVE') {
          console.log('Fallback found active license:', fallbackResult.data);
          setLicenseData(fallbackResult.data);
          setHasActiveLicense(true);
        } else {
          setHasActiveLicense(false);
          setLicenseData(null);
        }
      } catch (fallbackError) {
        console.error('Fallback license check also failed:', fallbackError);
        setHasActiveLicense(false);
        setLicenseData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshLicense = async () => {
    if (user) {
      console.log('Manually refreshing license status...');
      setLoading(true);
      
      // Clear all cache first
      queryClient.clear();
      
      // Force fresh data fetch
      await checkLicenseStatus(user.id);
      
      // Also invalidate all license-related queries
      queryClient.invalidateQueries({ queryKey: ['license'] });
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });
    }
  };

  useEffect(() => {
    let mounted = true;
    let realtimeChannel: any = null;

    // Set a backup timeout to prevent infinite loading
    const backupTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Backup timeout triggered, stopping loading');
        setLoading(false);
      }
    }, 15000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkLicenseStatus(session.user.id);
        } else {
          setHasActiveLicense(false);
          setLicenseData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkLicenseStatus(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Set up realtime subscription for fighter_profiles changes
    if (user) {
      realtimeChannel = supabase
        .channel('fighter-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'fighter_profiles'
          },
          (payload) => {
            console.log('Fighter profile updated, refreshing license data...');
            if (mounted) {
              checkLicenseStatus(user.id);
            }
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      clearTimeout(backupTimeout);
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/license/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const value = {
    user,
    session,
    loading,
    hasActiveLicense,
    licenseData,
    signIn,
    signUp,
    signOut,
    refreshLicense
  };

  return (
    <LicenseAuthContext.Provider value={value}>
      {children}
    </LicenseAuthContext.Provider>
  );
};

export const useLicenseAuth = () => {
  const context = useContext(LicenseAuthContext);
  if (context === undefined) {
    throw new Error('useLicenseAuth must be used within a LicenseAuthProvider');
  }
  return context;
};