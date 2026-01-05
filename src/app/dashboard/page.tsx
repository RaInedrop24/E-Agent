'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, MessageSquare, FileText, Clock, Bell, Receipt, SlidersHorizontal, Search } from "lucide-react";
import { formatRelativeTime } from '@/lib/date-utils';
import { EmptyState } from '@/components/ui/empty-state';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { logger } from '@/lib/logger';
import { LIMITS } from '@/lib/constants';
import { NotificationModal } from '@/components/features/NotificationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  title: string;
  agent_reference: string | null;
  status: string;
  created_at: string;
  last_updated: string;
  milestones: Array<{
    id: string;
    completed: boolean;
    order_index: number;
  }>;
}

interface ActivityItem {
  id: string;
  type: 'milestone' | 'message' | 'file' | 'notification';
  description: string;
  transaction_title: string;
  transaction_id: string;
  created_at: string;
  notification_data?: {
    subject: string;
    message: string;
    original_subject?: string;
    original_message?: string;
    created_at: string;
  };
}

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, tVar } = useLanguage();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ActivityItem['notification_data'] | null>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'last_updated' | 'created_at' | 'title' | 'agent_reference'>('last_updated');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Activity feed filters
  const [activityTypeFilters, setActivityTypeFilters] = useState({
    milestone: true,
    message: true,
    file: true,
    notification: true,
  });
  const [activityTimeRange, setActivityTimeRange] = useState<'24h' | '3d' | '7d' | '30d' | 'all'>('7d');
  const [showActivityFilterModal, setShowActivityFilterModal] = useState(false);

  // Load preferences from profile on mount
  useEffect(() => {
    if (profile) {
      setFilterActiveOnly(profile.dashboard_filter_active_only ?? false);
      setSortBy((profile.dashboard_sort_by as 'last_updated' | 'created_at' | 'title' | 'agent_reference') ?? 'last_updated');

      // Load activity filter preferences
      if (profile.activity_type_filters) {
        setActivityTypeFilters(profile.activity_type_filters as any);
      }
      if (profile.activity_time_range) {
        setActivityTimeRange(profile.activity_time_range as any);
      }

      setInitialized(true);
    }
  }, [profile]);

  // Save preferences to database when they change (but not on initial load)
  useEffect(() => {
    if (!user || !initialized) return;

    let isActive = true; // Track if component is still mounted

    const updatePreferences = async () => {
      try {
        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({
            dashboard_filter_active_only: filterActiveOnly,
            dashboard_sort_by: sortBy,
            activity_type_filters: activityTypeFilters,
            activity_time_range: activityTimeRange,
          })
          .eq('id', user.id);

        // Don't refresh profile here - it causes infinite loops
        // The profile will be updated on next page load or when explicitly needed
      } catch (error) {
        // Silently handle errors during cleanup
        if (isActive) {
          console.error('Error updating dashboard preferences:', error);
        }
      }
    };

    updatePreferences();

    // Cleanup function to prevent updates after unmount
    return () => {
      isActive = false;
    };
  }, [filterActiveOnly, sortBy, activityTypeFilters, activityTimeRange, user, initialized]);

  // Redirect agents to settings on first login if they haven't set up branding
  useEffect(() => {
    if (user && profile && profile.role === 'agent' && initialized) {
      // Check if this is a first-time login (no branding settings and website_url exists)
      const hasWebsiteUrl = profile.website_url;
      const hasBranding = profile.branding_settings && Object.keys(profile.branding_settings).length > 0;
      
      // If they have a website URL but no branding colors extracted, redirect to settings
      if (hasWebsiteUrl && !hasBranding) {
        router.push('/settings');
        return;
      }
    }
  }, [user, profile, initialized, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, filterActiveOnly, sortBy]);

  async function fetchDashboardData() {
    try {
      const supabase = createClient();

      // Fetch transactions where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('transaction_participants')
        .select('transaction_id')
        .eq('profile_id', user?.id);

      if (participantError) throw participantError;

      const transactionIds = participantData?.map((p: any) => p.transaction_id) || [];

      if (transactionIds.length === 0) {
        setTransactions([]);
        setRecentActivity([]);
        setLoading(false);
        return;
      }

      // Fetch transactions with milestones
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          title,
          agent_reference,
          status,
          created_at,
          last_updated,
          milestones (
            id,
            completed,
            order_index
          )
        `)
        .in('id', transactionIds);

      if (transactionsError) throw transactionsError;

      // Apply filtering
      let filteredTransactions: Transaction[] = transactionsData || [];
      if (filterActiveOnly) {
        filteredTransactions = filteredTransactions.filter((t: Transaction) => t.status === 'active');
      }

      // Apply sorting
      filteredTransactions.sort((a, b) => {
        switch (sortBy) {
          case 'last_updated':
          case 'created_at':
            return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
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

      setTransactions(filteredTransactions);

      // Fetch recent activity - milestones completed
      const { data: milestonesActivity, error: milestonesError } = await supabase
        .from('milestones')
        .select(`
          id,
          completed_at,
          label_en,
          transaction_id,
          transactions (title)
        `)
        .in('transaction_id', transactionIds)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Fetch recent messages
      const { data: messagesActivity, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          created_at,
          transaction_id,
          author_profile_id,
          transactions (title),
          profiles (full_name)
        `)
        .in('transaction_id', transactionIds)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent files
      const { data: filesActivity, error: filesError } = await supabase
        .from('files')
        .select(`
          id,
          created_at,
          file_name,
          transaction_id,
          transactions (title)
        `)
        .in('transaction_id', transactionIds)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent system notifications via API (which handles translations)
      let notificationsActivity: any[] = [];
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            // Get top 5 most recent notifications
            notificationsActivity = (data.notifications || []).slice(0, 5);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications for activity:', error);
      }

      // Combine and sort all activity
      const allActivity: ActivityItem[] = [];

      if (milestonesActivity) {
        milestonesActivity.forEach((m: any) => {
          allActivity.push({
            id: m.id,
            type: 'milestone',
            description: `milestone:${m.label_en}`, // Will be translated in render
            transaction_title: (m.transactions as any)?.title || 'Unknown',
            transaction_id: m.transaction_id,
            created_at: m.completed_at || '',
          });
        });
      }

      if (messagesActivity) {
        messagesActivity.forEach((m: any) => {
          const authorName = (m.profiles as any)?.full_name || 'Someone';
          allActivity.push({
            id: m.id,
            type: 'message',
            description: `message:${authorName}`, // Will be translated in render
            transaction_title: (m.transactions as any)?.title || 'Unknown',
            transaction_id: m.transaction_id,
            created_at: m.created_at,
          });
        });
      }

      if (filesActivity) {
        filesActivity.forEach((f: any) => {
          allActivity.push({
            id: f.id,
            type: 'file',
            description: `file:${f.file_name}`, // Will be translated in render
            transaction_title: (f.transactions as any)?.title || 'Unknown',
            transaction_id: f.transaction_id,
            created_at: f.created_at,
          });
        });
      }

      if (notificationsActivity && notificationsActivity.length > 0) {
        notificationsActivity.forEach((n: any) => {
          allActivity.push({
            id: n.id,
            type: 'notification',
            description: n.subject, // Already translated via API
            transaction_title: t('dashboard.systemAnnouncement'), // Not tied to a transaction
            transaction_id: '', // No transaction ID for system notifications
            created_at: n.created_at,
            // Store full notification data for modal
            notification_data: {
              subject: n.subject,
              message: n.message,
              original_subject: n.original_subject || n.subject,
              original_message: n.original_message || n.message,
              created_at: n.created_at,
            },
          });
        });
      }

      // Sort by date and take top 10
      allActivity.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecentActivity(allActivity.slice(0, LIMITS.MAX_RECENT_ACTIVITY));
      setLoading(false);

    } catch (error: any) {
      logger.error('Error fetching dashboard data', { userId: user?.id, error: error.message });
      setLoading(false);
    }
  }

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }
    const query = searchQuery.toLowerCase();
    return transactions.filter((transaction) =>
      transaction.title.toLowerCase().includes(query) ||
      (transaction.agent_reference && transaction.agent_reference.toLowerCase().includes(query))
    );
  }, [transactions, searchQuery]);

  // Filter recent activity based on type and time range
  const filteredActivity = useMemo(() => {
    let filtered = recentActivity;

    // Filter by type
    filtered = filtered.filter((activity) => {
      return activityTypeFilters[activity.type];
    });

    // Filter by time range
    if (activityTimeRange !== 'all') {
      const now = new Date();
      const cutoffTime = new Date();

      switch (activityTimeRange) {
        case '24h':
          cutoffTime.setHours(now.getHours() - 24);
          break;
        case '3d':
          cutoffTime.setDate(now.getDate() - 3);
          break;
        case '7d':
          cutoffTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffTime.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter((activity) => {
        return new Date(activity.created_at) >= cutoffTime;
      });
    }

    return filtered;
  }, [recentActivity, activityTypeFilters, activityTimeRange]);

  const calculateProgress = useMemo(() => {
    return (transaction: Transaction): number => {
      if (!transaction.milestones || transaction.milestones.length === 0) {
        return 0;
      }
      const completed = transaction.milestones.filter(m => m.completed).length;
      return Math.round((completed / transaction.milestones.length) * 100);
    };
  }, []);

  function getActivityIcon(type: string) {
    switch (type) {
      case 'milestone':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-info" />;
      case 'file':
        return <FileText className="w-4 h-4 text-info" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Skeleton height={32} width={200} />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton height={24} width={150} />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded p-3">
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={8} width="100%" className="mt-2" />
                  <Skeleton height={12} width="40%" className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton height={24} width={150} />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton circle width={16} height={16} />
                  <div className="flex-1">
                    <Skeleton height={16} width="90%" />
                    <Skeleton height={12} width="60%" className="mt-1" />
                  </div>
                  <Skeleton height={12} width={50} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>{t('transactions.my')}</CardTitle>
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('dashboard.filterSort') || 'Filter & Sort'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('dashboard.filterSort') || 'Filter & Sort Options'}</DialogTitle>
                  <DialogDescription>
                    {t('dashboard.filterSortDescription') || 'Customize how your transactions are displayed'}
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
                    <Label className="text-base font-semibold">{t('dashboard.filter') || 'Filter'}</Label>
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
                    {t('action.done') || 'Done'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredTransactions.length === 0 ? (
              searchQuery ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {t('dashboard.noSearchResults')}
                </div>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title={profile?.role === 'agent' ? t('dashboard.noTransactionsAgent') : t('dashboard.noTransactionsBuyer')}
                  description={profile?.role === 'agent'
                    ? t('dashboard.createFirst')
                    : t('dashboard.noInvitationsYet')}
                  action={profile?.role === 'agent' ? {
                    label: t('dashboard.createFirstButton'),
                    onClick: () => router.push('/transactions/create')
                  } : undefined}
                />
              )
            ) : (
              filteredTransactions.map((transaction) => {
                const progress = calculateProgress(transaction);
                return (
                  <Link
                    key={transaction.id}
                    href={`/transaction/${transaction.id}`}
                    className="block rounded border p-3 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{transaction.title}</span>
                        {transaction.agent_reference && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {t('transactions.ref')}: {transaction.agent_reference}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success capitalize whitespace-nowrap ml-2">
                        {transaction.status === 'active' ? t('status.active') : transaction.status === 'completed' ? t('status.completed') : t('status.archived')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Progress value={progress} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progress}% {t('dashboard.complete')}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(transaction.last_updated)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <Dialog open={showActivityFilterModal} onOpenChange={setShowActivityFilterModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('dashboard.filterSort') || 'Filter & Sort'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('dashboard.activityFilters') || 'Activity Filter Options'}</DialogTitle>
                  <DialogDescription>
                    {t('dashboard.activityFiltersDescription') || 'Customize which activities are displayed'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Time Range Filter */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">{t('dashboard.timeRange') || 'Time Range'}</Label>
                    <Select value={activityTimeRange} onValueChange={(value: '24h' | '3d' | '7d' | '30d' | 'all') => setActivityTimeRange(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">
                          {t('dashboard.last24Hours') || 'Last 24 hours'}
                        </SelectItem>
                        <SelectItem value="3d">
                          {t('dashboard.last3Days') || 'Last 3 days'}
                        </SelectItem>
                        <SelectItem value="7d">
                          {t('dashboard.last7Days') || 'Last 7 days'}
                        </SelectItem>
                        <SelectItem value="30d">
                          {t('dashboard.last30Days') || 'Last 30 days'}
                        </SelectItem>
                        <SelectItem value="all">
                          {t('dashboard.allTime') || 'All time'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activity Type Filters */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">{t('dashboard.activityTypes') || 'Activity Types'}</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="filter-milestone" className="font-normal cursor-pointer flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {t('dashboard.milestones') || 'Milestones'}
                        </Label>
                        <Switch
                          id="filter-milestone"
                          checked={activityTypeFilters.milestone}
                          onCheckedChange={(checked) => setActivityTypeFilters({ ...activityTypeFilters, milestone: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="filter-message" className="font-normal cursor-pointer flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-info" />
                          {t('dashboard.messages') || 'Messages'}
                        </Label>
                        <Switch
                          id="filter-message"
                          checked={activityTypeFilters.message}
                          onCheckedChange={(checked) => setActivityTypeFilters({ ...activityTypeFilters, message: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="filter-file" className="font-normal cursor-pointer flex items-center gap-2">
                          <FileText className="w-4 h-4 text-info" />
                          {t('dashboard.files') || 'Files'}
                        </Label>
                        <Switch
                          id="filter-file"
                          checked={activityTypeFilters.file}
                          onCheckedChange={(checked) => setActivityTypeFilters({ ...activityTypeFilters, file: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="filter-notification" className="font-normal cursor-pointer flex items-center gap-2">
                          <Bell className="w-4 h-4 text-warning" />
                          {t('dashboard.notifications') || 'Notifications'}
                        </Label>
                        <Switch
                          id="filter-notification"
                          checked={activityTypeFilters.notification}
                          onCheckedChange={(checked) => setActivityTypeFilters({ ...activityTypeFilters, notification: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowActivityFilterModal(false)}>
                    {t('action.done') || 'Done'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.noActivity')}
              </div>
            ) : (
              filteredActivity.map((activity) => {
                // Parse description format: "type:value"
                const [type, value] = activity.description.split(':');
                let displayText = activity.description;
                
                if (type === 'milestone') {
                  displayText = tVar('dashboard.milestoneCompleted', { milestone: value });
                } else if (type === 'message') {
                  displayText = tVar('dashboard.newMessageFrom', { author: value });
                } else if (type === 'file') {
                  displayText = tVar('dashboard.fileUploaded', { filename: value });
                } else if (type === 'notification') {
                  displayText = value; // Already translated via API
                }
                
                // For system notifications, make them clickable to open modal
                const isNotification = activity.type === 'notification' && activity.notification_data;
                const activityElement = (
                  <div 
                    className={`flex items-start gap-3 text-sm hover:bg-gray-50 p-2 rounded-md transition-colors ${
                      isNotification ? 'cursor-pointer' : ''
                    }`}
                    onClick={isNotification ? () => {
                      setSelectedNotification(activity.notification_data!);
                      setNotificationModalOpen(true);
                    } : undefined}
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900">{displayText}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {activity.transaction_title}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.created_at)}
                    </div>
                  </div>
                );

                return activity.type === 'notification' ? (
                  <div key={activity.id}>
                    {activityElement}
                  </div>
                ) : (
                  <Link
                    key={activity.id}
                    href={`/transaction/${activity.transaction_id}`}
                  >
                    {activityElement}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <NotificationModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
        notification={selectedNotification || null}
      />
    </div>
  );
}
