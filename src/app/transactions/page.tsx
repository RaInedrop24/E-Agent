'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  agent_reference?: string | null;
  status: string;
  created_at: string;
  last_updated: string;
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state - persist to database via profile
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'last_updated' | 'created_at' | 'title' | 'agent_reference'>('last_updated');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load preferences from profile on mount
  useEffect(() => {
    if (profile) {
      setFilterActiveOnly(profile.dashboard_filter_active_only ?? false);
      setSortBy((profile.dashboard_sort_by as 'last_updated' | 'created_at' | 'title' | 'agent_reference') ?? 'last_updated');
      setInitialized(true);
    }
  }, [profile]);

  // Get translated title based on user's language preference
  const getTranslatedTitle = useCallback((transaction: Transaction) => {
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
  }, [language]);

  // Save preferences to database when they change (but not on initial load)
  useEffect(() => {
    if (!user || !initialized) return;

    let isActive = true;

    const updatePreferences = async () => {
      try {
        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({
            dashboard_filter_active_only: filterActiveOnly,
            dashboard_sort_by: sortBy,
          })
          .eq('id', user.id);

        // Don't refresh profile here - it causes infinite loops
        // The profile will be updated on next page load or when explicitly needed
      } catch {
        if (isActive) {
          // no-op
        }
      }
    };

    updatePreferences();

    return () => {
      isActive = false;
    };
  }, [filterActiveOnly, sortBy, user, initialized]);

  useEffect(() => {
    // Wait for super admin check to complete before fetching
    if (user && !superAdminLoading) {
      fetchTransactions();
    }
  }, [user, isSuperAdmin, superAdminLoading]);

  // Apply all filters, sorting, and search
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Filter by agent (super admin only)
    if (selectedAgent !== 'all') {
      result = result.filter(tx => tx.created_by === selectedAgent);
    }

    // Filter by status (active only)
    if (filterActiveOnly) {
      result = result.filter(tx => tx.status === 'active');
    }

    // Filter by search query (title or agent_reference)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx =>
        getTranslatedTitle(tx).toLowerCase().includes(query) ||
        (tx.agent_reference && tx.agent_reference.toLowerCase().includes(query))
      );
    }

    // Sort by selected field
    result.sort((a, b) => {
      switch (sortBy) {
        case 'last_updated':
        case 'created_at':
          return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
        case 'title':
          return getTranslatedTitle(a).localeCompare(getTranslatedTitle(b));
        case 'agent_reference':
          // Handle null values - put them at the end
          if (!a.agent_reference && !b.agent_reference) return 0;
          if (!a.agent_reference) return 1;
          if (!b.agent_reference) return -1;
          return a.agent_reference.localeCompare(b.agent_reference);
        default:
          return 0;
      }
    });

    return result;
  }, [allTransactions, selectedAgent, filterActiveOnly, searchQuery, sortBy, getTranslatedTitle]);

  // Update transactions when filtered results change
  useEffect(() => {
    setTransactions(filteredAndSortedTransactions);
  }, [filteredAndSortedTransactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const supabase = createClient();
      if (isSuperAdmin) {
        // Super admin can see ALL transactions
        const { data: allTx, error: allError } = await supabase
          .from('transactions')
          .select(`
            *,
            profiles!transactions_created_by_fkey(id, full_name)
          `)
          .order('created_at', { ascending: false });

        if (allError) {
          throw allError;
        }

        // Add agent name to transactions
        const transactionsWithAgent = (allTx || []).map(
          (tx: Transaction & { profiles?: { id: string; full_name: string | null } | null }) => ({
            ...tx,
            agent_name: tx.profiles?.full_name || 'Unknown Agent',
          })
        );

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
            const count = transactionsWithAgent.filter((tx: Transaction) => tx.created_by === agent.id).length;
            return {
              ...agent,
              transaction_count: count,
            };
          });
          setAgents(agentsWithCounts);
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

        // Combine and deduplicate (the joined transaction comes back as a single object;
        // cast needed because the client's inferred type disagrees with the runtime shape)
        type ParticipationRow = { transaction_id: string; transactions: Transaction | null };
        const participantTx = ((participation || []) as unknown as ParticipationRow[])
          .map((p) => p.transactions)
          .filter(Boolean);

        // Create a map to deduplicate by ID
        const txMap = new Map<string, Transaction>();

        // Add created transactions
        createdTx?.forEach((tx: Transaction) => txMap.set(tx.id, tx));

        // Add participated transactions (if not already present)
        participantTx.forEach((tx: Transaction | null) => {
          if (tx && !txMap.has(tx.id)) {
            txMap.set(tx.id, tx);
          }
        });

        // Convert back to array and sort
        const allTx = Array.from(txMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAllTransactions(allTx);
        setTransactions(allTx);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
          <div className="flex flex-col gap-4">
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
              <div className="flex items-center gap-2">
                {isSuperAdmin && agents.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">Agent:</span>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({allTransactions.length})</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name} ({agent.transaction_count || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter & Sort
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Filter & Sort Options</DialogTitle>
                      <DialogDescription>
                        Customize how your transactions are displayed
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Sort Options */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('dashboard.sortBy')}</Label>
                        <Select value={sortBy} onValueChange={(value: 'last_updated' | 'created_at' | 'title' | 'agent_reference') => setSortBy(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="last_updated">
                              {t('dashboard.lastUpdated')} ({t('dashboard.newestFirst')})
                            </SelectItem>
                            <SelectItem value="created_at">
                              {t('dashboard.createdDate')} ({t('dashboard.newestFirst')})
                            </SelectItem>
                            <SelectItem value="title">
                              {t('dashboard.sortByTitle')}
                            </SelectItem>
                            <SelectItem value="agent_reference">
                              {t('dashboard.sortByAgentRef')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter Options */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">{t('dashboard.filter')}</Label>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="filter-active-only" className="font-normal cursor-pointer">
                            {t('dashboard.showActiveOnly')}
                          </Label>
                          <Switch
                            id="filter-active-only"
                            checked={filterActiveOnly}
                            onCheckedChange={setFilterActiveOnly}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setShowFilterModal(false)}>
                        {t('action.done')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : error ? (
            <div className="text-red-500 py-4">Error: {error}</div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {transactions.length === 0 ? (
                searchQuery || filterActiveOnly ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('dashboard.noSearchOrFilterResults')}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('transactions.noTransactions')}</p>
                    {isAgent && (
                      <p className="mt-2 text-sm">
                        {t('dashboard.createFirst')}
                      </p>
                    )}
                  </div>
                )
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
                            {transaction.agent_reference && (
                              <>
                                <span className="font-medium">{t('transactions.ref')}: {transaction.agent_reference}</span>
                                <span>•</span>
                              </>
                            )}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
