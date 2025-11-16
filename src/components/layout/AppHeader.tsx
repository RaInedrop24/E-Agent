'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import type { User as AppUser } from '@/types';

function toAppUser(profile: any, email: string, meta: any): AppUser {
  const full = (profile?.full_name as string) || (meta?.full_name as string) || (meta?.name as string) || '';
  const [firstName, ...rest] = full.split(' ');
  const lastName = rest.join(' ');
  const role = (profile?.role as 'agent' | 'buyer') || (meta?.role as 'agent' | 'buyer') || 'buyer';
  return {
    id: (profile?.id as string) || (meta?.id as string) || 'unknown',
    email,
    role,
    preferredLanguage: 'en',
    firstName: firstName || '',
    lastName: lastName || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AppHeader() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) return;
      const { data: auth } = await supabase.auth.getUser();
      const authed = auth.user;
      if (!mounted) return;
      if (!authed) {
        setUser(null);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authed.id)
          .maybeSingle();
        const appUser = toAppUser(profile, authed.email ?? '', authed.user_metadata || {});
        setUser(appUser);
      } catch {
        setUser({
          id: authed.id,
          email: authed.email ?? '',
          role: (authed.user_metadata?.role as 'agent' | 'buyer') || 'buyer',
          preferredLanguage: 'en',
          firstName: (authed.user_metadata?.full_name as string)?.split(' ')?.[0] || '',
          lastName: (authed.user_metadata?.full_name as string)?.split(' ')?.slice(1).join(' ') || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    load();
    const sub = supabase?.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  const onLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return <Header user={user} onLogout={onLogout} />;
}

