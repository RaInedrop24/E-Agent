import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSuperAdmin() {
  const { user, profile } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);
  const lastCheckedProfileId = useRef<string | null>(null);

  useEffect(() => {
    // Prevent re-running if we've already checked for this user/profile combination
    const currentUserId = user?.id || null;
    const currentProfileId = profile?.id || null;
    
    if (currentUserId === lastCheckedUserId.current && 
        currentProfileId === lastCheckedProfileId.current &&
        !loading) {
      // Already checked for this user/profile, skip
      return;
    }

    async function checkSuperAdmin() {
      console.log('[useSuperAdmin] Starting check...', {
        hasUser: !!user,
        hasSupabase: !!supabase,
        userId: user?.id,
        profileId: profile?.id,
        profileIsSuperAdmin: profile?.is_super_admin,
      });

      if (!user || !supabase) {
        console.log('[useSuperAdmin] No user or supabase, setting false');
        setIsSuperAdmin(false);
        setLoading(false);
        lastCheckedUserId.current = null;
        lastCheckedProfileId.current = null;
        return;
      }

      // Update refs to track what we've checked
      lastCheckedUserId.current = user.id;
      lastCheckedProfileId.current = profile?.id || null;

      try {
        // First check profile cache
        if (profile?.is_super_admin) {
          console.log('[useSuperAdmin] Profile cache shows super admin = true');
          setIsSuperAdmin(true);
          setLoading(false);
          return;
        }

        console.log('[useSuperAdmin] Profile cache does not show super admin, calling RPC...');

        // Otherwise call RPC function
        const { data, error } = await supabase.rpc('current_user_is_super_admin');

        if (error) {
          // Only log actual errors with meaningful content, not empty objects
          // Check if error object has any meaningful properties
          if (!error || typeof error !== 'object') {
            setIsSuperAdmin(false);
            return;
          }
          
          const errorKeys = Object.keys(error);
          
          // If error is an empty object (no keys), silently return - this is expected for non-super-admin users
          if (errorKeys.length === 0) {
            setIsSuperAdmin(false);
            return;
          }
          
          // Check if any error property has meaningful content
          const hasMeaningfulError = errorKeys.some(key => {
            try {
              const value = (error as any)[key];
              // Check if the value is a non-empty string
              if (typeof value === 'string' && value.trim().length > 0) return true;
              // Check if the value is a number (even 0 is meaningful for error codes)
              if (typeof value === 'number') return true;
              // Check if the value is a boolean
              if (typeof value === 'boolean') return true;
              // Check if the value is a non-empty object/array
              if (value && typeof value === 'object') {
                if (Array.isArray(value) && value.length > 0) return true;
                if (Object.keys(value).length > 0) return true;
              }
              return false;
            } catch {
              return false;
            }
          });
          
          // Only log if there's actual error information
          if (hasMeaningfulError) {
            console.error('[useSuperAdmin] RPC error:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
          }
          setIsSuperAdmin(false);
        } else {
          console.log('[useSuperAdmin] RPC result:', data);
          setIsSuperAdmin(data === true);
        }
      } catch (error) {
        console.error('[useSuperAdmin] Unexpected error:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [user?.id, profile?.id, profile?.is_super_admin, loading]);

  return { isSuperAdmin, loading };
}
