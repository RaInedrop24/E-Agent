'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Transaction {
  id: string;
  title: string;
  title_en?: string | null;
  title_it?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  status: string;
  created_at: string;
  created_by: string;
  agent_name?: string;
}

interface Agent {
  id: string;
  full_name: string;
  transaction_count?: number;
}

export default function TransactionsListPage() {
  const { user, profile } = useAuth();
  const { t, tVar, language } = useLanguage();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();

  console.log('[Transactions] Component render - isSuperAdmin:', isSuperAdmin, 'loading:', superAdminLoading);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get translated title based on user's language preference
  const getTranslatedTitle = (transaction: Transaction) => {
    const langKey = `title_${language}` as keyof Transaction;
    const translatedTitle = transaction[langKey] as string | null | undefined;
    
    // If we have a translation for the user's language, use it
    if (translatedTitle && translatedTitle.trim()) {
      return translatedTitle;
    }
    
    // Fallback: try English, then the main title field
    if (transaction.title_en && transaction.title_en.trim()) {
      return transaction.title_en;
    }
    
    // Last resort: use the main title field
    return transaction.title || '';
  };

  useEffect(() => {
    console.log('[Transactions] useEffect triggered - user:', !!user, 'isSuperAdmin:', isSuperAdmin, 'superAdminLoading:', superAdminLoading);

    // Wait for super admin check to complete before fetching
    if (user && !superAdminLoading) {
      console.log('[Transactions] Calling fetchTransactions...');
      fetchTransactions();
    }
  }, [user, isSuperAdmin, superAdminLoading]);

  useEffect(() => {
    // Filter transactions when agent selection changes
    if (selectedAgent === 'all') {
      setTransactions(allTransactions);
    } else {
      const filtered = allTransactions.filter(tx => tx.created_by === selectedAgent);
      setTransactions(filtered);
    }
  }, [selectedAgent, allTransactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      console.log('[Transactions] isSuperAdmin:', isSuperAdmin);

      if (isSuperAdmin) {
        // Super admin can see ALL transactions
        console.log('[Transactions] Fetching as super admin...');
        const { data: allTx, error: allError } = await supabase
          .from('transactions')
          .select(`
            *,
            profiles!transactions_created_by_fkey(id, full_name)
          `)
          .order('created_at', { ascending: false });

        console.log('[Transactions] Super admin query result:', {
          count: allTx?.length,
          error: allError?.message,
          firstItem: allTx?.[0]
        });

        if (allError) {
          console.error('[Transactions] Error fetching as super admin:', allError);
          throw allError;
        }

        // Add agent name to transactions
        const transactionsWithAgent = (allTx || []).map((tx: any) => ({
          ...tx,
          agent_name: tx.profiles?.full_name || 'Unknown Agent',
        }));

        setAllTransactions(transactionsWithAgent);
        setTransactions(transactionsWithAgent);

        // Get list of all agents for filter with transaction counts
        const { data: agentsList, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'agent')
          .order('full_name');

        if (!agentsError && agentsList) {
          // Add transaction count to each agent
          const agentsWithCounts = agentsList.map((agent: Agent) => {
            const count = transactionsWithAgent.filter(tx => tx.created_by === agent.id).length;
            return {
              ...agent,
              transaction_count: count,
            };
          });
          setAgents(agentsWithCounts as any);
        }
      } else {
        // Regular user: get only their transactions
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

        setAllTransactions(allTx);
        setTransactions(allTx);
      }
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
        {isSuperAdmin && (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin View
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isSuperAdmin ? 'All Transactions' : t('transactions.my')}</CardTitle>
              <CardDescription>
                {tVar('transactions.found', { count: transactions.length })}
                {isSuperAdmin && allTransactions.length !== transactions.length && (
                  <span> (filtered from {allTransactions.length} total)</span>
                )}
              </CardDescription>
            </div>
            {isSuperAdmin && agents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter by agent:</span>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents ({allTransactions.length})</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.transaction_count || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
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
                <Link key={transaction.id} href={`/transaction/${transaction.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:border-primary hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="space-y-1 flex-1">
                      <div className="font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                          {getTranslatedTitle(transaction)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{t('transactions.createdOn')} {new Date(transaction.created_at).toLocaleDateString()}</span>
                        {isSuperAdmin && transaction.agent_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {transaction.agent_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={transaction.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
