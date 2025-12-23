import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSuperAdmin() {
  const { user, profile } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user || !supabase) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // First check profile cache
        if (profile?.is_super_admin) {
          setIsSuperAdmin(true);
          setLoading(false);
          return;
        }

        // Otherwise call RPC function
        const { data, error } = await supabase.rpc('current_user_is_super_admin');

        if (error) {
          console.error('[useSuperAdmin] Error checking super admin status:', error);
          setIsSuperAdmin(false);
        } else {
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
