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
  const [isForced, setIsForced] = useState(false);

  // Check if user is authenticated (must be logged in to change password)
  useEffect(() => {
    async function checkSession() {
      try {
        if (!supabase) {
          setError('Supabase not configured');
          setCheckingSession(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // No session - redirect to login
          router.push('/login?error=Please login with your credentials to change your password');
          return;
        }

        // Check if this is a forced password change
        const force = searchParams?.get('force');
        setIsForced(force === 'true');

        setCheckingSession(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify session');
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [searchParams, router]);

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

      // Get current user metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update password AND clear first-login flags
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          ...user.user_metadata,
          must_change_password: false,
          first_login: false,
        },
      });

      if (updateError) throw updateError;

      // Redirect to dashboard - they're already logged in
      router.push('/dashboard?password-updated=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
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
          <CardTitle>{isForced ? '⚠️ Password Change Required' : 'Set Your Password'}</CardTitle>
          <CardDescription>
            {isForced 
              ? 'For security, you must change your default password before continuing.' 
              : 'Create a secure password for your account'}
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
