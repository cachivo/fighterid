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
      
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const checkPromise = (async () => {
        // First check if user exists in app_user table
        const { data: appUser } = await supabase
          .from('app_user')
          .select('*')
          .eq('auth_user_id', userId)
          .maybeSingle();
        
        console.log('App user data:', appUser);
        
        if (!appUser) {
          console.log('No app user found');
          setLicenseData(null);
          setHasActiveLicense(false);
          return;
        }

        // Get user's fighter profile
        const { data: profile, error: profileError } = await supabase
          .from('fighter_profiles')
          .select('*')
          .eq('user_id', appUser.id)
          .eq('active', true)
          .maybeSingle();

        console.log('Profile data:', profile);
        console.log('Profile error:', profileError);

        if (!profile) {
          console.log('No fighter profile found');
          setLicenseData(null);
          setHasActiveLicense(false);
          return;
        }

        // Get any license for this fighter with profile data included
        const { data: licenses, error: licenseError } = await supabase
          .from('fighter_licenses')
          .select(`
            *,
            fighter_profiles!fighter_licenses_fighter_id_fkey(
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
              document_number,
              document_type,
              birthdate,
              blood_type,
              emergency_contact_name,
              emergency_contact_phone,
              emergency_contact_relation,
              medical_conditions,
              medical_allergies,
              height_cm,
              weight_kg,
              reach_cm,
              fighting_style,
              martial_arts,
              gym_name,
              bio,
              stance,
              gender,
              birthplace,
              insurance_company,
              insurance_policy,
              level
            )
          `)
          .eq('fighter_id', profile.id)
          .order('created_at', { ascending: false });

        console.log('Licenses data:', licenses);
        console.log('License error:', licenseError);

        if (licenses && licenses.length > 0) {
          // Get the most recent license
          const latestLicense = licenses[0];
          console.log('Latest license found:', latestLicense);
          setLicenseData(latestLicense);
          const isActive = latestLicense.status === 'ACTIVE';
          setHasActiveLicense(isActive);
          
          // Invalidate relevant queries when license status changes
          if (isActive) {
            queryClient.invalidateQueries({ queryKey: ['license'] });
            queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
            queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });
          }
        } else {
          console.log('No licenses found');
          setLicenseData(null);
          setHasActiveLicense(false);
        }
      })();

      await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error checking license status:', error);
      setHasActiveLicense(false);
      setLicenseData(null);
    } finally {
      // Always ensure loading is set to false
      setLoading(false);
    }
  };

  const refreshLicense = async () => {
    if (user) {
      console.log('Manually refreshing license status...');
      setLoading(true);
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