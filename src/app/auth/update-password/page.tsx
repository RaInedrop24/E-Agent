'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UpdatePasswordPage() {
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

        // Check if we have a token in the URL (invite/recovery flow)
        const token = searchParams?.get('token');
        const tokenHash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');

        if (token && (type === 'invite' || type === 'recovery')) {
          // Exchange token for session
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token,
            type: type === 'invite' ? 'invite' : 'recovery',
          });

          if (verifyError) {
            setError('Invalid or expired link. Please request a new invitation.');
            setCheckingSession(false);
            return;
          }
        } else if (tokenHash) {
          // Handle token_hash format
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(tokenHash);
          if (exchangeError) {
            setError('Invalid or expired link. Please request a new invitation.');
            setCheckingSession(false);
            return;
          }
        }

        // Verify we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Auth session missing! Please use the link from your invitation email.');
          setCheckingSession(false);
          return;
        }

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

      // Password updated successfully
      router.push('/dashboard?password-updated=true');
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
