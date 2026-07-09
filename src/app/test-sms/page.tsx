'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('+44');
  const [message, setMessage] = useState('Test message from Property Gateway');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">SMS Test Tool</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test SMS Sending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number (with country code)</Label>
            <Input
              type="tel"
              placeholder="+447427132147"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +44 for UK, +1 for US)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Input
              type="text"
              placeholder="Test message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Test SMS'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-4 rounded overflow-auto">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Enter your phone number with country code (e.g., +447427132147)</p>
          <p>2. Click &quot;Send Test SMS&quot;</p>
          <p>3. Check this page for results AND check your terminal/command prompt for detailed logs</p>
          <p className="font-semibold mt-4">
            Common Issues:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Twilio trial accounts can only send to verified numbers</li>
            <li>Phone number must include country code with + prefix</li>
            <li>Check that TWILIO_SID, TWILIO_SECRET, and TWILIO_PHONE_NUMBER are set in .env.local</li>
            <li>The &quot;from&quot; number must be a valid Twilio number you own</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
