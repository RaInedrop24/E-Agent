'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminDebugState {
  sessionId: string | null;
  email: string | null;
  isAgent: boolean | null;
  profile: Record<string, unknown> | null;
  status: string;
  error: string | null;
}

const initialState: AdminDebugState = {
  sessionId: null,
  email: null,
  isAgent: null,
  profile: null,
  status: 'Idle',
  error: null,
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [debugState, setDebugState] = useState(initialState);

  const isConfigured = useMemo(() => Boolean(supabase), []);

  const refreshDebugState = async () => {
    if (!supabase) {
      setDebugState((prev) => ({
        ...prev,
        status: 'Supabase client not configured',
        error: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      }));
      return;
    }

    try {
      setLoading(true);
      setDebugState((prev) => ({ ...prev, status: 'Checking session...', error: null }));

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      const user = sessionData?.session?.user ?? null;

      let profile: Record<string, unknown> | null = null;
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, preferred_language, role, avatar_url, created_at')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        profile = profileData ?? null;
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('current_user_is_agent');
      if (rpcError) {
        throw rpcError;
      }

      const parseBoolean = (value: unknown) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'object' && value !== null) {
          if ('current_user_is_agent' in (value as Record<string, unknown>)) {
            return Boolean((value as Record<string, unknown>).current_user_is_agent);
          }
          if ('is_agent' in (value as Record<string, unknown>)) {
            return Boolean((value as Record<string, unknown>).is_agent);
          }
        }
        if (Array.isArray(value) && value.length) {
          return parseBoolean(value[0]);
        }
        return Boolean(value);
      };

      const isAgent = parseBoolean(rpcData);

      setDebugState({
        sessionId: user?.id ?? null,
        email: user?.email ?? null,
        profile,
        isAgent,
        status: user ? 'Authenticated session loaded' : 'No authenticated session',
        error: null,
      });
    } catch (err) {
      setDebugState((prev) => ({
        ...prev,
        status: 'Failed to load debug info',
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDebugState();

    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshDebugState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Site Admin</h1>
          <p className="text-sm text-muted-foreground">
            A lightweight admin dashboard for agent-only debugging tools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshDebugState} disabled={loading || !isConfigured}>
            Refresh
          </Button>
          <Button variant="outline" onClick={signOut} disabled={!isConfigured}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Session</CardTitle>
            <CardDescription>See the authenticated user that powers RLS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>Status: {debugState.status}</div>
            <div>
              Session user ID:{' '}
              <span className="font-mono">{debugState.sessionId ?? 'Not available'}</span>
            </div>
            <div>
              Email: <span className="font-mono">{debugState.email ?? 'Not available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>current_user_is_agent:</span>
              {debugState.isAgent === null ? (
                <Badge variant="secondary">Unknown</Badge>
              ) : debugState.isAgent ? (
                <Badge variant="default">true</Badge>
              ) : (
                <Badge variant="destructive">false</Badge>
              )}
            </div>
            {debugState.error && (
              <div className="text-xs text-red-600 break-words">
                {debugState.error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Mirror</CardTitle>
            <CardDescription>Matches the `public.profiles` row for the current user.</CardDescription>
          </CardHeader>
          <CardContent>
            {debugState.profile ? (
              <pre className="text-xs bg-slate-50 border border-slate-200 p-3 rounded overflow-auto">
                {JSON.stringify(debugState.profile, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-muted-foreground">
                No profile found. Use the profile debug page to create one or fix RLS.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debugging Resources</CardTitle>
          <CardDescription>
            Quick links to helpful pages and scripts that support testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Authentication & Session</h3>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost">
                  <Link href="/debug/session">Session Debug</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/debug/profile">Profile Debug</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/debug/supabase">Supabase Config</Link>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Notifications & Alerts</h3>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost">
                  <Link href="/debug/sms-config">SMS Alert Settings</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/test-sms">Test SMS Sending</Link>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Business Data</h3>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost">
                  <Link href="/transactions">Transactions</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/buyers">Buyers</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground pt-2 border-t">
            Use the Supabase dashboard scripts (`debug_check_all_policies.sql`, `debug_test_agent_function.sql`) available in the repo when you need deeper visibility.
          </div>
        </CardContent>
      </Card>

      {/* TODO: PRODUCTION SECURITY - SUPER ADMIN REQUIRED */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">⚠️ Production Security Notice</CardTitle>
          <CardDescription className="text-red-700">
            This page is currently accessible to all authenticated users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-red-900">
          <p className="font-semibold">Before going to production, implement:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>SUPER ADMIN role in the database (new role type beyond agent/buyer)</li>
            <li>Server-side middleware to restrict access to /admin/* routes</li>
            <li>Check user role before rendering this page (redirect non-super-admins)</li>
            <li>Audit logging for all admin actions</li>
            <li>Consider IP whitelisting for extra security</li>
          </ul>
          <p className="text-xs mt-3 text-red-700">
            Currently, any authenticated user can access /admin and all debug pages.
            This is acceptable for development but MUST be secured before production deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

