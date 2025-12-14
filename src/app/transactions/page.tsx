'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  title: string;
  status: string;
  created_at: string;
  created_by: string;
}

export default function TransactionsListPage() {
  const { user, profile } = useAuth();
  const { t, tVar } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
        // If auth is still initializing, we might wait, but if user is null after init we should probably redirect or show login prompt.
        // For this page, assuming AuthContext handles initial load, we can just wait for user.
        // If user is definitely null (logged out), the AuthContext or middleware usually handles protection, 
        // but here we'll just show empty or loading until user is present.
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      // First, get transactions created by the user
      const { data: createdTx, error: createdError } = await supabase
        .from('transactions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdError) throw createdError;

      // Then get transactions where user is a participant
      const { data: participation, error: partError } = await supabase
        .from('transaction_participants')
        .select('transaction_id, transactions(*)')
        .eq('profile_id', user.id);

      if (partError) throw partError;

      // Combine and deduplicate
      const participantTx = participation
        ?.map((p: any) => p.transactions)
        .filter(Boolean) || [];

      // Create a map to deduplicate by ID
      const txMap = new Map();
      
      // Add created transactions
      createdTx?.forEach((tx: any) => txMap.set(tx.id, tx));

      // Add participated transactions (if not already present)
      participantTx.forEach((tx: any) => {
        if (!txMap.has(tx.id)) {
          txMap.set(tx.id, tx);
        }
      });

      // Convert back to array and sort
      const allTx = Array.from(txMap.values()).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(allTx);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAgent = profile?.role === 'agent';

  if (!user && !loading) {
     return (
        <div className="max-w-4xl mx-auto p-4 text-center">
            <p>Please log in to view transactions.</p>
            <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
        </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('transactions.title')}</h1>
        {isAgent && (
          <Link href="/transactions/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('transactions.new')}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.my')}</CardTitle>
          <CardDescription>
            {tVar('transactions.found', { count: transactions.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : error ? (
            <div className="text-red-500 py-4">Error: {error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('transactions.noTransactions')}</p>
              {isAgent && (
                <p className="mt-2 text-sm">
                  {t('dashboard.createFirst')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2">
                        {transaction.title}
                        <Badge variant={transaction.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.status}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/transaction/${transaction.id}`}>
                    <Button variant="outline" size="sm">
                      {t('transactions.viewDetails')}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
