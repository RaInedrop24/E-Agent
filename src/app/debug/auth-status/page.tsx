'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthStatusPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(`Session error: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      setAuthData({
        hasSession: !!session,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
      });

      // Check profile if user exists
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setProfileData({
          exists: !!profile,
          profile: profile,
          error: profileError?.message || null,
          errorCode: profileError?.code || null,
        });
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleCreateProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_profile_for_current_user');

      if (error) {
        setError(`Profile creation error: ${error.message}`);
      } else {
        alert('Profile created successfully!');
        await checkAuthStatus();
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Loading auth status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Auth Status Debug</h1>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle>Session Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-semibold">Has Session:</div>
            <div>{authData?.hasSession ? '✅ Yes' : '❌ No'}</div>

            {authData?.hasSession && (
              <>
                <div className="font-semibold">User ID:</div>
                <div className="font-mono text-sm">{authData.userId}</div>

                <div className="font-semibold">Email:</div>
                <div>{authData.email}</div>
              </>
            )}
          </div>

          {authData?.hasSession && (
            <div className="pt-4">
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Status */}
      {authData?.hasSession && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Profile Exists:</div>
              <div>{profileData?.exists ? '✅ Yes' : '❌ No'}</div>

              {profileData?.error && (
                <>
                  <div className="font-semibold">Error:</div>
                  <div className="text-red-600">{profileData.error}</div>

                  <div className="font-semibold">Error Code:</div>
                  <div className="text-red-600">{profileData.errorCode}</div>
                </>
              )}

              {profileData?.exists && profileData?.profile && (
                <>
                  <div className="font-semibold">Name:</div>
                  <div>{profileData.profile.full_name || '(not set)'}</div>

                  <div className="font-semibold">Role:</div>
                  <div>{profileData.profile.role}</div>

                  <div className="font-semibold">Language:</div>
                  <div>{profileData.profile.preferred_language}</div>
                </>
              )}
            </div>

            {!profileData?.exists && (
              <div className="pt-4 space-y-2">
                <p className="text-yellow-700 bg-yellow-50 p-4 rounded border border-yellow-200">
                  ⚠️ Profile is missing. This is causing the console errors.
                </p>
                <Button onClick={handleCreateProfile}>
                  Create Profile Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>What To Do</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {authData?.hasSession ? (
            <>
              <p>✅ You have an active session.</p>
              {profileData?.exists ? (
                <>
                  <p>✅ Your profile exists.</p>
                  <p className="text-green-700 font-semibold">
                    Everything looks good! The console errors should not appear.
                  </p>
                </>
              ) : (
                <>
                  <p>❌ Your profile is missing.</p>
                  <p className="text-yellow-700">
                    This is why you're seeing console errors. Click "Create Profile Now" above to fix it.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <p>ℹ️ You are not logged in.</p>
              <p>The console errors should not appear. If they do, clear your browser cache and cookies.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
