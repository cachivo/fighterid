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

      // 1) Get app_user to resolve internal user_id
      const { data: appUser, error: appUserErr } = await supabase
        .from('app_user')
        .select('id, email')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (appUserErr) console.warn('app_user fetch error:', appUserErr);

      // If no app_user, allow onboarding
      if (!appUser?.id) {
        console.log('No app_user row found - onboarding allowed');
        setLicenseData(null);
        setHasActiveLicense(false);
        setLoading(false);
        return;
      }

      // 2) Get fighter profile for this user
      const { data: profile, error: profileErr } = await supabase
        .from('fighter_profiles')
        .select('*')
        .eq('user_id', appUser.id)
        .eq('active', true)
        .maybeSingle();

      if (profileErr) console.warn('fighter_profiles fetch error:', profileErr);

      if (!profile?.id) {
        console.log('No fighter profile found');
        setLicenseData(null);
        setHasActiveLicense(false);
        setLoading(false);
        return;
      }

      console.log('Fighter profile found:', profile?.id);

      // 3) Resolve license with robust fallbacks (prefer ACTIVE primary)
      const selectCols = 'id, license_number, status, license_level, issued_at, expires_at, is_primary, qr_code_url';

      // Try ACTIVE primary
      let { data: license } = await supabase
        .from('fighter_licenses')
        .select(selectCols)
        .eq('fighter_id', profile.id)
        .eq('status', 'ACTIVE')
        .eq('is_primary', true)
        .maybeSingle();

      // Fallbacks in order of preference
      if (!license) {
        const res1 = await supabase
          .from('fighter_licenses')
          .select(selectCols)
          .eq('fighter_id', profile.id)
          .eq('status', 'ACTIVE')
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        license = res1.data ?? null;
      }

      if (!license) {
        const res2 = await supabase
          .from('fighter_licenses')
          .select(selectCols)
          .eq('fighter_id', profile.id)
          .eq('status', 'PENDING_REVIEW')
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        license = res2.data ?? null;
      }

      if (license) {
        console.log('Resolved license:', license.status, license.license_number);
        const combinedLicenseData = { ...license, fighter_profiles: profile };
        setLicenseData(combinedLicenseData);
        setHasActiveLicense(license.status === 'ACTIVE');
      } else {
        console.log('No ACTIVE/PENDING license found');
        setLicenseData({ fighter_profiles: profile });
        setHasActiveLicense(false);
      }

    } catch (error) {
      console.error('Error checking license status:', error);
      // Don't block onboarding process
      setHasActiveLicense(false);
      setLicenseData(null);
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
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkLicenseStatus(session.user.id);
          }, 0);
        } else {
          setHasActiveLicense(false);
          setLicenseData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkLicenseStatus(session.user.id);
        }, 0);
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

    if (error) {
      const message = /registered|exists|already/i.test(error.message)
        ? 'Este correo ya está registrado. Intenta iniciar sesión o recupera tu contraseña.'
        : error.message;
      return { error: { message } };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Error al cerrar sesión local:', e);
    } finally {
      setSession(null);
      setUser(null);
      setHasActiveLicense(false);
      setLicenseData(null);
      queryClient.clear();
      setLoading(false);
      navigate('/', { replace: true });
    }
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