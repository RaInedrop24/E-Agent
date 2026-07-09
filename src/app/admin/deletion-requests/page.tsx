'use client';

/**
 * Super-admin queue for GDPR account deletion requests.
 * Lists all requests; pending ones can be completed (permanent user
 * deletion) or cancelled. Protected by the super-admin proxy rules
 * plus per-request auth in the API route.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: 'pending' | 'cancelled' | 'completed';
  requested_at: string;
  processed_at: string | null;
  full_name: string | null;
  role: string | null;
  email: string | null;
}

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/deletion-requests');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const process = async (requestId: string, action: 'complete' | 'cancel') => {
    if (
      action === 'complete' &&
      !window.confirm(
        'Permanently delete this user and their personal data? This cannot be undone.'
      )
    ) {
      return;
    }
    setBusyId(requestId);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/deletion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const statusBadge = (status: DeletionRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">GDPR Deletion Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and process account erasure requests (Art. 17).
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No deletion requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">
                    {req.full_name || 'Unknown user'}{' '}
                    <span className="font-normal text-muted-foreground">
                      {req.email ? `(${req.email})` : ''}
                    </span>
                  </CardTitle>
                  {statusBadge(req.status)}
                </div>
                <CardDescription>
                  {req.role ? `Role: ${req.role} · ` : ''}
                  Requested {new Date(req.requested_at).toLocaleString()}
                  {req.processed_at
                    ? ` · Processed ${new Date(req.processed_at).toLocaleString()}`
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {req.reason && (
                  <p className="text-sm bg-muted rounded-md p-3">&ldquo;{req.reason}&rdquo;</p>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId === req.id}
                      onClick={() => process(req.id, 'complete')}
                    >
                      {busyId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Delete account permanently'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === req.id}
                      onClick={() => process(req.id, 'cancel')}
                    >
                      Reject request
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
