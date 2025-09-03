import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  const checkLicenseStatus = async (userId: string) => {
    try {
      console.log('Checking license status for user:', userId);
      
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

      // Get the primary license for this fighter
      const { data: license, error: licenseError } = await supabase
        .from('fighter_licenses')
        .select('*')
        .eq('fighter_id', profile.id)
        .eq('is_primary', true)
        .maybeSingle();

      console.log('License data:', license);
      console.log('License error:', licenseError);

      if (license) {
        console.log('License found:', license);
        setLicenseData(license);
        setHasActiveLicense(license.status === 'ACTIVE');
      } else {
        console.log('No license found');
        setLicenseData(null);
        setHasActiveLicense(false);
      }
    } catch (error) {
      console.error('Error checking license status:', error);
      setHasActiveLicense(false);
      setLicenseData(null);
    }
  };

  const refreshLicense = async () => {
    if (user) {
      await checkLicenseStatus(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkLicenseStatus(session.user.id);
        } else {
          setHasActiveLicense(false);
          setLicenseData(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkLicenseStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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