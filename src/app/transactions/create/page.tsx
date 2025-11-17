'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTransactionPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      setError('You must be logged in to create a transaction');
      return;
    }

    if (profile.role !== 'agent') {
      setError('Only agents can create transactions');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a transaction title');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          title: title.trim(),
          property_address: propertyAddress.trim() || null,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (txError) throw txError;

      if (!transaction) {
        throw new Error('Transaction created but no data returned');
      }

      // Create default milestones using the helper function
      const { error: milestonesError } = await supabase.rpc('create_default_milestones', {
        p_transaction_id: transaction.id,
      });

      if (milestonesError) {
        console.error('[CreateTransaction] Error creating milestones:', milestonesError);
        // Don't throw - transaction is already created, we can add milestones manually later
      }

      // Redirect to the new transaction
      router.push(`/transaction/${transaction.id}`);
    } catch (err: any) {
      console.error('[CreateTransaction] Error:', err);
      setError(err.message || 'Failed to create transaction');
      setLoading(false);
    }
  };

  // Redirect if not an agent
  if (profile && profile.role !== 'agent') {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only agents can create transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Transaction</h1>
          <p className="text-muted-foreground mt-1">
            Start tracking a new property transaction
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Enter the basic information for this property transaction. You can invite buyers
            and manage milestones after creating the transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Transaction Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Villa in Tuscany Purchase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for this transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyAddress">Property Address (Optional)</Label>
              <Textarea
                id="propertyAddress"
                placeholder="e.g., Via Roma 123, 50100 Florence, Italy"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                The address of the property being purchased
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
              <strong>What happens next:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Transaction will be created with default milestones</li>
                <li>You will be automatically added as a participant</li>
                <li>You can invite buyers from the transaction detail page</li>
                <li>Milestones can be checked off as the purchase progresses</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
