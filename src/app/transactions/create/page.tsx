'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

interface Buyer {
  id: string;
  full_name: string;
  email: string;
}

export default function CreateTransactionPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'agent') {
      fetchBuyers();
    }
  }, [profile]);

  const fetchBuyers = async () => {
    try {
      setLoadingBuyers(true);
      if (!supabase) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          auth_users:id (email)
        `)
        .eq('role', 'buyer')
        .order('full_name');

      if (error) throw error;

      // Transform the data to get emails
      const buyersWithEmails = await Promise.all(
        (data || []).map(async (profile) => {
          // Get email from auth.users via RPC or direct query
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name || 'Unknown',
            email: userData?.user?.email || 'No email',
          };
        })
      ).catch(async () => {
        // Fallback: get emails from profiles if they have email field
        // or use a simpler query
        const { data: profilesWithAuth } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'buyer');

        // Get emails from auth metadata
        return Promise.all(
          (profilesWithAuth || []).map(async (p) => {
            // Query auth.users to get email
            const { data } = await supabase.rpc('get_user_email', { user_id: p.id }).catch(() => ({ data: null }));
            return {
              id: p.id,
              full_name: p.full_name || 'Unknown',
              email: data || 'No email',
            };
          })
        );
      });

      // Simple fallback - just get profiles without emails
      const simpleBuyers = (data || []).map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        email: p.id, // Use ID as placeholder
      }));

      setBuyers(simpleBuyers);
      setLoadingBuyers(false);
    } catch (err) {
      console.error('Error fetching buyers:', err);
      setLoadingBuyers(false);
    }
  };

  const toggleBuyer = (buyerId: string) => {
    setSelectedBuyerIds(prev =>
      prev.includes(buyerId)
        ? prev.filter(id => id !== buyerId)
        : [...prev, buyerId]
    );
  };

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

      // Add selected buyers to transaction
      if (selectedBuyerIds.length > 0) {
        const participantsToAdd = selectedBuyerIds.map(buyerId => ({
          transaction_id: transaction.id,
          profile_id: buyerId,
          participant_role: 'buyer',
        }));

        const { error: participantsError } = await supabase
          .from('transaction_participants')
          .insert(participantsToAdd);

        if (participantsError) {
          console.error('[CreateTransaction] Error adding buyers:', participantsError);
          // Don't throw - transaction is created, buyers can be added later
        }
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

            {/* Buyer Selection */}
            <div className="space-y-2">
              <Label>Invite Buyers (Optional)</Label>
              {loadingBuyers ? (
                <div className="text-sm text-muted-foreground">Loading buyers...</div>
              ) : buyers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No registered buyers found</div>
              ) : (
                <div className="space-y-2">
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {buyers.map(buyer => (
                      <label
                        key={buyer.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBuyerIds.includes(buyer.id)}
                          onChange={() => toggleBuyer(buyer.id)}
                          disabled={loading}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{buyer.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            ID: {buyer.id.slice(0, 8)}...
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedBuyerIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedBuyerIds.map(id => {
                        const buyer = buyers.find(b => b.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                          >
                            {buyer?.full_name}
                            <button
                              type="button"
                              onClick={() => toggleBuyer(id)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                              disabled={loading}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Select buyers to invite to this transaction. You can also invite buyers later.
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
                <li>Selected buyers will be invited to the transaction</li>
                <li>Milestones can be checked off as the purchase progresses</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
