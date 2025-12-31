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
  dashboard_filter_active_only?: boolean;
  dashboard_sort_by?: string;
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

  useEffect(() => {
    // Check if supabase is configured
    if (!supabase) {
      console.warn('[AuthContext] Supabase client not configured');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then((response: AuthResponse) => {
      const initialSession = response.data.session;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      // Set cookie for middleware to access
      if (initialSession && typeof document !== 'undefined') {
        document.cookie = `sb-skvfgvlwccxetglmfhpm-auth-token=${JSON.stringify({
          access_token: initialSession.access_token,
          refresh_token: initialSession.refresh_token,
        })}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        console.log('[AuthContext] Initial cookie set');
      }

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

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
        console.log('[AuthContext] Cookie set for session');
      } else if (typeof document !== 'undefined') {
        // Clear cookie on logout
        document.cookie = 'sb-skvfgvlwccxetglmfhpm-auth-token=; path=/; max-age=0';
        console.log('[AuthContext] Cookie cleared');
      }

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching profile for user:', userId);

      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] Current session exists:', !!session);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        console.error('[AuthContext] Error message:', error.message || 'No error message');
        console.error('[AuthContext] Error code:', error.code || 'No error code');

        // If no profile exists (PGRST116), try to create one automatically
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] No profile found, attempting to create one...');
          try {
            const { data: newProfile, error: createError } = await supabase.rpc('create_profile_for_current_user');
            if (createError) {
              console.error('[AuthContext] Error creating profile:', createError);
              setProfile(null);
            } else {
              console.log('[AuthContext] Profile created successfully:', newProfile);
              setProfile(newProfile);
            }
          } catch (createErr) {
            console.error('[AuthContext] Exception creating profile:', createErr);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } else {
        console.log('[AuthContext] Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (err) {
      console.error('[AuthContext] Exception fetching profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
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
