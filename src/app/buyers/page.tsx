'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Trash2,
  Edit,
  Mail,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Buyer {
  id: string;
  full_name: string | null;
  preferred_language: string;
  avatar_url: string | null;
  created_at: string;
  email?: string;
}

export default function BuyersPage() {
  const { user, profile } = useAuth();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create buyer modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBuyerEmail, setNewBuyerEmail] = useState('');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerLanguage, setNewBuyerLanguage] = useState('en');
  const [creating, setCreating] = useState(false);

  // Edit buyer modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [editName, setEditName] = useState('');
  const [editLanguage, setEditLanguage] = useState('en');
  const [updating, setUpdating] = useState(false);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBuyer, setDeletingBuyer] = useState<Buyer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.role === 'agent') {
      fetchBuyers();
    }
  }, [profile]);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase || !user) return;

      // Fetch buyers associated with this agent
      const { data: associations, error: assocError } = await supabase
        .from('buyer_agent_associations')
        .select(`
          buyer_id,
          profiles!buyer_agent_associations_buyer_id_fkey (
            id,
            full_name,
            preferred_language,
            avatar_url,
            created_at
          )
        `)
        .eq('agent_id', user.id);

      if (assocError) throw assocError;

      // Transform data
      const buyersList = (associations || []).map(a => ({
        id: (a.profiles as any).id,
        full_name: (a.profiles as any).full_name,
        preferred_language: (a.profiles as any).preferred_language,
        avatar_url: (a.profiles as any).avatar_url,
        created_at: (a.profiles as any).created_at,
      }));

      setBuyers(buyersList);
    } catch (err: any) {
      console.error('Error fetching buyers:', err);
      setError(err.message || 'Failed to load buyers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      if (!supabase || !user) {
        throw new Error('Not authenticated');
      }

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      // Call our API route to create the buyer (server-side with service role)
      const response = await fetch('/api/buyers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newBuyerEmail,
          fullName: newBuyerName,
          preferredLanguage: newBuyerLanguage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create buyer');
      }

      // Reset form and close modal
      setNewBuyerEmail('');
      setNewBuyerName('');
      setNewBuyerLanguage('en');
      setCreateModalOpen(false);

      // Refresh buyers list
      await fetchBuyers();
    } catch (err: any) {
      console.error('Error creating buyer:', err);
      setError(err.message || 'Failed to create buyer');
    } finally {
      setCreating(false);
    }
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setEditName(buyer.full_name || '');
    setEditLanguage(buyer.preferred_language);
    setEditModalOpen(true);
  };

  const handleUpdateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuyer) return;

    setUpdating(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          preferred_language: editLanguage,
        })
        .eq('id', editingBuyer.id);

      if (updateError) throw updateError;

      setEditModalOpen(false);
      setEditingBuyer(null);
      await fetchBuyers();
    } catch (err: any) {
      console.error('Error updating buyer:', err);
      setError(err.message || 'Failed to update buyer');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBuyer = async () => {
    if (!deletingBuyer) return;

    setDeleting(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase not configured');

      // Delete association (profile will remain, just unlinked from this agent)
      const { error: deleteError } = await supabase
        .from('buyer_agent_associations')
        .delete()
        .eq('buyer_id', deletingBuyer.id)
        .eq('agent_id', user?.id);

      if (deleteError) throw deleteError;

      setDeleteModalOpen(false);
      setDeletingBuyer(null);
      await fetchBuyers();
    } catch (err: any) {
      console.error('Error deleting buyer:', err);
      setError(err.message || 'Failed to delete buyer');
    } finally {
      setDeleting(false);
    }
  };

  const handleResendInvite = async (buyer: Buyer) => {
    try {
      if (!supabase) return;

      // Get buyer email from auth.users
      const { data: userData } = await supabase.auth.admin.getUserById(buyer.id);
      const email = userData?.user?.email;

      if (!email) {
        throw new Error('Could not find buyer email');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        }
      );

      if (error) throw error;

      alert(`Invitation email sent to ${email}`);
    } catch (err: any) {
      console.error('Error resending invite:', err);
      setError(err.message || 'Failed to resend invitation');
    }
  };

  // Redirect if not an agent
  if (profile && profile.role !== 'agent') {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only agents can access buyer management.</CardDescription>
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Buyer Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your buyers and send invitations
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Buyer
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Buyers List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Buyers ({buyers.length})</CardTitle>
          <CardDescription>
            Buyers you've created can be invited to transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading buyers...
            </div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven't created any buyers yet.
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Your First Buyer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {buyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{buyer.full_name || 'Unnamed Buyer'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Language: {buyer.preferred_language.toUpperCase()} •{' '}
                      Created {new Date(buyer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvite(buyer)}
                      title="Resend invitation email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditBuyer(buyer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingBuyer(buyer);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Buyer Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Buyer</DialogTitle>
            <DialogDescription>
              Create a buyer account and send them an invitation email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBuyer}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newBuyerEmail}
                  onChange={(e) => setNewBuyerEmail(e.target.value)}
                  placeholder="buyer@example.com"
                  required
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newBuyerName}
                  onChange={(e) => setNewBuyerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select
                  value={newBuyerLanguage}
                  onValueChange={setNewBuyerLanguage}
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create & Send Invite'}
              </Button>
            </DialogFooter>
          </form>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm">
            <strong>Note:</strong> The buyer will receive an email to set their password.
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Buyer Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Buyer</DialogTitle>
            <DialogDescription>
              Update buyer information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBuyer}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={updating}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select
                  value={editLanguage}
                  onValueChange={setEditLanguage}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Buyer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Buyer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this buyer? This will remove them from your
              list but will not delete their account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Buyer: <strong>{deletingBuyer?.full_name}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteBuyer}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Buyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
