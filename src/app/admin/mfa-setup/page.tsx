'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

export default function MFASetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/admin';

  const [step, setStep] = useState<'check' | 'enroll' | 'verify' | 'complete'>('check');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingMFA();
  }, []);

  const checkExistingMFA = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      if (data.all && data.all.length > 0) {
        // MFA already set up
        setStep('complete');
      } else {
        // Need to set up MFA
        setStep('enroll');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check MFA status');
      setStep('enroll');
    } finally {
      setLoading(false);
    }
  };

  const enrollMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      // Generate QR code from the URI
      const qrCode = await QRCode.toDataURL(data.totp.uri);
      setQrCodeUrl(qrCode);
      setFactorId(data.id);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll MFA');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!factorId) {
        throw new Error('No factor ID available');
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push(returnTo);
  };

  if (step === 'check') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Checking MFA status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>MFA Already Configured</CardTitle>
            </div>
            <CardDescription>
              Two-factor authentication is active on your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account is secured with two-factor authentication. You can now access admin features.
            </p>
            <Button onClick={handleContinue} className="w-full">
              Continue to Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Super admin accounts require MFA for security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'enroll' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>To secure your super admin account, you must enable two-factor authentication.</p>
                <p className="font-semibold">You&apos;ll need:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
                  <li>Your mobile device</li>
                </ul>
              </div>
              <Button onClick={enrollMFA} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Up MFA
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-semibold">Step 1: Scan QR Code</p>
                <p>Open your authenticator app and scan this QR code:</p>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-white border rounded-lg">
                  <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-semibold">Step 2: Enter Verification Code</p>
                <p>Enter the 6-digit code from your authenticator app:</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                onClick={verifyMFA}
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify and Enable MFA
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p className="font-semibold mb-1">Why is this required?</p>
            <p>
              Super admin accounts have access to sensitive data and administrative functions.
              Two-factor authentication adds an extra layer of security to prevent unauthorized access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
