'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SuperAdminDebugPage() {
  const { user, profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      user: null,
      profile: null,
      profileFromDb: null,
      rpcResult: null,
      columnExists: null,
      functionExists: null,
      errors: [],
    };

    try {
      // 1. Check current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        info.errors.push(`User error: ${userError.message}`);
      } else {
        info.user = {
          id: currentUser?.id,
          email: currentUser?.email,
        };
      }

      // 2. Check profile from context
      info.profile = {
        id: profile?.id,
        role: profile?.role,
        is_super_admin: profile?.is_super_admin,
        full_name: profile?.full_name,
      };

      // 3. Fetch profile directly from database
      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, is_super_admin, full_name')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          info.errors.push(`Profile fetch error: ${profileError.message} (code: ${profileError.code})`);
        } else {
          info.profileFromDb = profileData;
        }
      }

      // 4. Test RPC function
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('current_user_is_super_admin');
        if (rpcError) {
          info.errors.push(`RPC error: ${rpcError.message} (code: ${rpcError.code})`);
          info.rpcResult = null;
        } else {
          info.rpcResult = rpcData;
        }
      } catch (rpcException: any) {
        info.errors.push(`RPC exception: ${rpcException.message}`);
        info.rpcResult = null;
      }

      // 5. Check if column exists (this will fail if column doesn't exist)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .limit(1);
        
        if (error) {
          info.errors.push(`Column check error: ${error.message}`);
          info.columnExists = false;
        } else {
          info.columnExists = true;
        }
      } catch (e: any) {
        info.errors.push(`Column check exception: ${e.message}`);
        info.columnExists = false;
      }

      // 6. Try to check if function exists (indirect check)
      try {
        const { data, error } = await supabase.rpc('current_user_is_super_admin');
        if (error && error.code === '42883') {
          info.functionExists = false;
          info.errors.push('RPC function does not exist (42883)');
        } else {
          info.functionExists = true;
        }
      } catch (e: any) {
        info.errors.push(`Function check exception: ${e.message}`);
      }

    } catch (error: any) {
      info.errors.push(`General error: ${error.message}`);
    } finally {
      setLoading(false);
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Super Admin Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running Diagnostics...' : 'Refresh Diagnostics'}
            </Button>
          </div>

          {debugInfo.timestamp && (
            <div className="space-y-4 text-sm font-mono">
              <div>
                <strong>Timestamp:</strong> {debugInfo.timestamp}
              </div>

              <div className="border-t pt-4">
                <strong className="text-lg">User Info:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(debugInfo.user, null, 2)}
                </pre>
              </div>

              <div className="border-t pt-4">
                <strong className="text-lg">Profile (from Context):</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(debugInfo.profile, null, 2)}
                </pre>
              </div>

              <div className="border-t pt-4">
                <strong className="text-lg">Profile (from Database):</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(debugInfo.profileFromDb, null, 2)}
                </pre>
              </div>

              <div className="border-t pt-4">
                <strong className="text-lg">RPC Function Result:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(debugInfo.rpcResult, null, 2)}
                </pre>
              </div>

              <div className="border-t pt-4">
                <strong className="text-lg">Checks:</strong>
                <div className="mt-2 space-y-1">
                  <div>
                    Column exists: {' '}
                    <span className={debugInfo.columnExists ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.columnExists ? '✓ YES' : '✗ NO'}
                    </span>
                  </div>
                  <div>
                    Function exists: {' '}
                    <span className={debugInfo.functionExists ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.functionExists ? '✓ YES' : '✗ NO'}
                    </span>
                  </div>
                </div>
              </div>

              {debugInfo.errors && debugInfo.errors.length > 0 && (
                <div className="border-t pt-4">
                  <strong className="text-lg text-red-600">Errors:</strong>
                  <ul className="mt-2 space-y-1 text-red-600">
                    {debugInfo.errors.map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="text-yellow-600">
              Please log in to run diagnostics.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Migration SQL to Run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            If the column or function doesn't exist, run these migrations in your Supabase SQL Editor:
          </p>
          
          <div>
            <strong>1. Add Column & Function:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
{`-- Add super_admin column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
ON public.profiles(is_super_admin)
WHERE is_super_admin = true;

-- Create RPC function
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;`}
            </pre>
          </div>

          <div>
            <strong>2. Set Super Admin:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
{`-- Replace with your email
UPDATE public.profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@rainedrop.co.uk'
);`}
            </pre>
          </div>

          <div>
            <strong>3. Verify:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
{`-- Check if column exists and has data
SELECT id, full_name, role, is_super_admin 
FROM public.profiles 
WHERE is_super_admin = true;

-- Test RPC function
SELECT public.current_user_is_super_admin();`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

