'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthResponse, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  preferred_language: string;
  role: 'agent' | 'buyer';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_super_admin?: boolean;
  branding_logo_url?: string | null;
  branding_settings?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  } | null;
  website_url?: string | null;
  dashboard_filter_active_only?: boolean;
  dashboard_sort_by?: string;
  activity_type_filters?: {
    milestone: boolean;
    message: boolean;
    file: boolean;
    notification: boolean;
  };
  activity_time_range?: '24h' | '3d' | '7d' | '30d' | 'all';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStoredSession = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-skvfgvlwccxetglmfhpm-auth-token=; path=/; max-age=0';
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('sb-skvfgvlwccxetglmfhpm-auth-token');
    }
    if (supabase) {
      supabase.auth.stopAutoRefresh();
    }
  };

  useEffect(() => {
    // Check if supabase is configured
    if (!supabase) {
      setLoading(false);
      return;
    }

    const hasStoredSession =
      typeof window !== 'undefined' &&
      !!window.localStorage.getItem('sb-skvfgvlwccxetglmfhpm-auth-token');

    if (hasStoredSession) {
      // Get initial session and validate it
      supabase.auth.getSession().then(async (response: AuthResponse) => {
        const initialSession = response.data.session;
        const sessionError = response.error;
        
        // Handle refresh token errors silently - just clear the session
        if (sessionError) {
          if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('refresh_token')) {
            // Silently clear invalid session
            clearStoredSession();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        // If we have a session, validate it by calling getUser()
        // This forces Supabase to check if the tokens are actually valid
        if (initialSession) {
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !validatedUser) {
            // Session is invalid/expired - clear everything
            clearStoredSession();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Set cookie for middleware to access
        if (initialSession && typeof document !== 'undefined') {
          document.cookie = `sb-skvfgvlwccxetglmfhpm-auth-token=${JSON.stringify({
            access_token: initialSession.access_token,
            refresh_token: initialSession.refresh_token,
          })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }

        if (initialSession?.user) {
          supabase.auth.startAutoRefresh();
          fetchProfile(initialSession.user.id);
        } else {
          supabase.auth.stopAutoRefresh();
          setLoading(false);
        }
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED')) {
          clearStoredSession();
        }
        setLoading(false);
      });
    } else {
      supabase.auth.stopAutoRefresh();
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Set cookie for middleware to access
      if (currentSession && typeof document !== 'undefined') {
        document.cookie = `sb-skvfgvlwccxetglmfhpm-auth-token=${JSON.stringify({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } else if (typeof document !== 'undefined') {
        // Clear cookie on logout
        document.cookie = 'sb-skvfgvlwccxetglmfhpm-auth-token=; path=/; max-age=0';
      }

      if (currentSession?.user) {
        supabase.auth.startAutoRefresh();
        fetchProfile(currentSession.user.id);
      } else {
        supabase.auth.stopAutoRefresh();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If no profile exists (PGRST116), try to create one automatically
        if (error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } = await supabase.rpc('create_profile_for_current_user');
            if (createError) {
              setProfile(null);
            } else {
              setProfile(newProfile);
            }
          } catch (createErr) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      return;
    }
    await fetchProfile(user.id);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirect(true);
    }
  }, [user, loading]);

  return { user, loading, shouldRedirect, redirectTo };
}

// Hook to require specific role
export function useRequireRole(requiredRole: 'agent' | 'buyer', redirectTo: string = '/dashboard') {
  const { profile, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && profile && profile.role !== requiredRole) {
      setShouldRedirect(true);
    }
  }, [profile, loading, requiredRole]);

  return { profile, loading, shouldRedirect, redirectTo };
}
