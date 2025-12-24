import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSuperAdmin() {
  const { user, profile } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        return;
      }

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
          console.error('[useSuperAdmin] RPC error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
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
  }, [user, profile]);

  return { isSuperAdmin, loading };
}
