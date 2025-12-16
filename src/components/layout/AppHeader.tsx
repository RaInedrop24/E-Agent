'use client';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import type { User as AppUser } from '@/types';

export function AppHeader() {
  const router = useRouter();
  const { user: authUser, profile, signOut, loading } = useAuth();

  // Convert profile and auth user to AppUser format
  const user: AppUser | null = authUser && profile
    ? {
        id: authUser.id,
        email: authUser.email ?? '',
        role: profile.role,
        preferredLanguage: profile.preferred_language || 'en',
        firstName: profile.full_name?.split(' ')?.[0] || '',
        lastName: profile.full_name?.split(' ')?.slice(1).join(' ') || '',
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }
    : null;

  const onLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    // Return header without user while loading
    return <Header user={null} onLogout={onLogout} />;
  }

  return <Header user={user} onLogout={onLogout} />;
}

