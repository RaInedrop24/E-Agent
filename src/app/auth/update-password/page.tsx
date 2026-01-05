'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function UpdatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for token in URL and exchange it for a session
  useEffect(() => {
    async function checkSession() {
      try {
        if (!supabase) {
          setError('Supabase not configured');
          setCheckingSession(false);
          return;
        }

        // Check if we're coming from an invite callback (session should already exist)
        const fromInvite = searchParams?.get('from_invite');
        
        // First, check if we already have a session (from Supabase's verify redirect or callback)
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // If we have a session and came from invite, we're good to go
        if (session && fromInvite) {
          console.log('Session verified from invite callback');
          setCheckingSession(false);
          return;
        }

        // Check for access_token in URL hash (Supabase implicit flow)
        // This happens when Supabase redirects after verifying invite
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('type');
          
          if (accessToken) {
            console.log('Found access_token in URL hash, establishing session...');
            // Supabase should auto-detect and set the session
            // Wait a moment for it to process
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the session that Supabase should have set
            const { data: { session: hashSession } } = await supabase.auth.getSession();
            if (hashSession) {
              session = hashSession;
              console.log('Session established from hash params');
              setCheckingSession(false);
              return;
            }
          }
        }

        // If no session, check for tokens in URL (direct link flow)
        if (!session) {
          const token = searchParams?.get('token');
          const tokenHash = searchParams?.get('token_hash');
          const type = searchParams?.get('type');

          console.log('No session found, checking for tokens:', { token: !!token, tokenHash: !!tokenHash, type });

          if (token && (type === 'invite' || type === 'recovery')) {
            // Exchange token for session
            console.log('Verifying OTP token...');
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token,
              type: type === 'invite' ? 'invite' : 'recovery',
            });

            if (verifyError) {
              console.error('Token verification error:', verifyError);
              setError(`Invalid or expired link: ${verifyError.message}. Please request a new invitation.`);
              setCheckingSession(false);
              return;
            }

            // Get session after verification
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          } else if (tokenHash) {
            // Handle token_hash format (PKCE flow)
            console.log('Exchanging token_hash for session...');
            const { error: exchangeError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type === 'invite' ? 'invite' : 'recovery',
            });

            if (exchangeError) {
              console.error('Token hash exchange error:', exchangeError);
              setError(`Invalid or expired link: ${exchangeError.message}. Please request a new invitation.`);
              setCheckingSession(false);
              return;
            }

            // Get session after exchange
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          }
        }

        // Final check - verify we have a session
        if (!session) {
          console.error('No session available after token verification');
          setError('Auth session missing! Please use the link from your invitation email. If you copied the link, make sure to use the complete URL from the email.');
          setCheckingSession(false);
          return;
        }

        console.log('Session verified successfully');
        setCheckingSession(false);
      } catch (err: any) {
        console.error('Error checking session:', err);
        setError(err.message || 'Failed to verify session');
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Password updated successfully - get user email and auto-login
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;

      if (userEmail) {
        // Auto-login with the new password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: newPassword,
        });

        if (signInError) {
          // If auto-login fails, redirect to login with pre-filled email
          router.push(`/login?email=${encodeURIComponent(userEmail)}&password-set=true`);
        } else {
          // Successfully logged in, redirect to dashboard
          router.push('/dashboard?password-updated=true');
        }
      } else {
        // No email available, redirect to login
        router.push('/login?password-set=true');
      }
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Your Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation link...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Create a secure password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Set Password'}
            </Button>
          </form>
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm">
            <strong>Password requirements:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>At least 8 characters long</li>
              <li>Mix of letters and numbers recommended</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              Please wait...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
}
