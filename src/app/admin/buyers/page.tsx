'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SendSystemMessageDialog } from '@/components/features/SendSystemMessageDialog';
import { Loader2, Shield, Users, Mail, Calendar, FileText, ArrowLeft, Search, Bell } from 'lucide-react';

interface Buyer {
  id: string;
  full_name: string;
  email?: string;
  created_at: string;
  transaction_count?: number;
  last_activity?: string;
}

export default function AllBuyersPage() {
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (!superAdminLoading) {
      if (!isSuperAdmin) {
        window.location.href = '/dashboard';
      } else {
        fetchBuyers();
      }
    }
  }, [isSuperAdmin, superAdminLoading]);

  useEffect(() => {
    // Filter buyers based on search query
    if (searchQuery.trim() === '') {
      setFilteredBuyers(buyers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = buyers.filter(buyer =>
        buyer.full_name.toLowerCase().includes(query) ||
        buyer.email?.toLowerCase().includes(query)
      );
      setFilteredBuyers(filtered);
    }
  }, [searchQuery, buyers]);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch buyers from API endpoint
      const response = await fetch('/api/super-admin/buyers');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch buyers');
      }

      const data = await response.json();
      setBuyers(data.buyers || []);
      setFilteredBuyers(data.buyers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (superAdminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading buyers: {error}</p>
            <Button onClick={fetchBuyers} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                All Buyers
              </h1>
              <p className="text-muted-foreground mt-1">Registered buyers across all agents</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationDialogOpen(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Send Notification
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin View
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyers.length}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyers.filter(b => (b.transaction_count || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">In active transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyers.length > 0
                ? (buyers.reduce((sum, b) => sum + (b.transaction_count || 0), 0) / buyers.length).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per buyer</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Buyers List</CardTitle>
              <CardDescription>
                {filteredBuyers.length} of {buyers.length} buyers
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBuyers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No buyers found{searchQuery && ' matching your search'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:border-blue-300 hover:bg-slate-50 transition-all"
                >
                  <div className="space-y-1 flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {buyer.full_name}
                      {(buyer.transaction_count || 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {buyer.transaction_count} transaction{buyer.transaction_count !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {buyer.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registered {new Date(buyer.created_at).toLocaleDateString()}
                      </span>
                      {buyer.last_activity && buyer.last_activity !== buyer.created_at && (
                        <>
                          <span>•</span>
                          <span>
                            Last active {new Date(buyer.last_activity).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(buyer.transaction_count || 0) === 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        No Transactions
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Message Dialogs */}
      <SendSystemMessageDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        recipientType="buyers"
        messageType="notification"
      />
      <SendSystemMessageDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        recipientType="buyers"
        messageType="email"
      />
    </div>
  );
}
