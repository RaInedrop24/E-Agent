'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugProfilePage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      // Get current auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        setError({ step: 'auth', error: authError });
        setLoading(false);
        return;
      }

      setAuthUser(user);

      if (!user) {
        setError({ step: 'auth', error: 'No user logged in' });
        setLoading(false);
        return;
      }

      // Try to fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError({ step: 'profile', error: profileError });
      } else {
        setProfile(profileData);
      }

      setLoading(false);
    } catch (err: any) {
      setError({ step: 'exception', error: err });
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!authUser) return;

    try {
      setLoading(true);

      // Try Method 1: Use the RPC function (requires SQL fix to be applied)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_profile_for_current_user');

      if (!rpcError && rpcData?.success) {
        setProfile(rpcData.profile);
        setError(null);
        setLoading(false);
        return;
      }

      // Try Method 2: Direct insert (requires INSERT policy)
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || 'Test User',
          role: authUser.user_metadata?.role || 'agent',
          preferred_language: authUser.user_metadata?.preferred_language || 'en',
        })
        .select()
        .single();

      if (error) {
        setError({
          step: 'create_profile',
          error,
          hint: 'Please apply the SQL fix: supabase/APPLY_THIS_FIX.sql',
        });
      } else {
        setProfile(data);
        setError(null);
      }
      setLoading(false);
    } catch (err: any) {
      setError({ step: 'create_profile_exception', error: err });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Profile Debug Page</h1>

      {loading && <div>Loading...</div>}

      {/* Auth User */}
      <Card>
        <CardHeader>
          <CardTitle>Auth User</CardTitle>
        </CardHeader>
        <CardContent>
          {authUser ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(authUser, null, 2)}
            </pre>
          ) : (
            <div className="text-red-600">No user logged in</div>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile in Database</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <div>
              <div className="text-red-600 mb-4">
                No profile found in database
              </div>
              {authUser && (
                <button
                  onClick={createProfile}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  Create Profile Manually
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <strong>Step:</strong> {error.step}
            </div>
            <pre className="bg-red-50 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(error.error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            onClick={checkProfile}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
          >
            Refresh
          </button>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Dashboard
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
