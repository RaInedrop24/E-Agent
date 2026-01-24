'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SMSConfigPage() {
  const [userAlerts, setUserAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/check-user-alerts')
      .then(res => res.json())
      .then(data => {
        setUserAlerts(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">SMS & Alert Configuration Debug</h1>
        <Link href="/test-sms">
          <Button>Test SMS Sending</Button>
        </Link>
      </div>

      {userAlerts && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold">{userAlerts.summary.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email Alerts ON</div>
                  <div className="text-2xl font-bold">{userAlerts.summary.emailAlertsEnabled}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">SMS Alerts ON</div>
                  <div className="text-2xl font-bold">{userAlerts.summary.smsAlertsEnabled}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">With Phone #</div>
                  <div className="text-2xl font-bold">{userAlerts.summary.withPhoneNumber}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Alert Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAlerts.profiles.map((profile: any) => (
                  <div key={profile.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{profile.full_name || 'Unnamed User'}</div>
                        <div className="text-sm text-muted-foreground">{profile.email || 'No email'}</div>
                        <div className="text-xs text-muted-foreground">Role: {profile.role}</div>
                      </div>
                      <Badge variant={profile.role === 'agent' ? 'default' : 'secondary'}>
                        {profile.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Email Alerts:</span>
                        <Badge variant={profile.email_alerts_enabled ? 'default' : 'outline'}>
                          {profile.email_alerts_enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">SMS Alerts:</span>
                        <Badge variant={profile.sms_alerts_enabled ? 'default' : 'outline'}>
                          {profile.sms_alerts_enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                    </div>

                    {profile.phone_number && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <div className="text-xs text-muted-foreground">Phone Number:</div>
                        <div className="font-mono text-sm">{profile.phone_number}</div>
                      </div>
                    )}

                    {profile.sms_alerts_enabled && !profile.phone_number && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="text-xs text-yellow-800">
                          ⚠️ SMS alerts enabled but no phone number provided
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Troubleshooting SMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">If SMS is not working, check:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>User has SMS alerts enabled (toggle is ON in settings)</li>
                <li>User has entered a valid phone number with country code</li>
                <li>Phone number format: +[country code][number] (e.g., +447427132147)</li>
                <li>Twilio credentials are configured in .env.local:
                  <ul className="list-disc list-inside ml-6 mt-1 text-xs">
                    <li>TWILIO_SID</li>
                    <li>TWILIO_SECRET</li>
                    <li>TWILIO_PHONE_NUMBER (your verified Twilio number)</li>
                  </ul>
                </li>
                <li>If using Twilio trial account, recipient number must be verified in Twilio dashboard</li>
                <li>Check server logs (terminal where npm run dev is running) for detailed error messages</li>
              </ol>
              <div className="mt-4">
                <Link href="/test-sms">
                  <Button>Go to SMS Test Tool →</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
