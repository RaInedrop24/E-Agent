'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, MessageSquare, FileText, Clock, Bell, Receipt } from "lucide-react";
import { formatRelativeTime } from '@/lib/date-utils';
import { EmptyState } from '@/components/ui/empty-state';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Transaction {
  id: string;
  title: string;
  status: string;
  created_at: string;
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
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { t, tVar } = useLanguage();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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
          status,
          created_at,
          milestones (
            id,
            completed,
            order_index
          )
        `)
        .in('id', transactionIds)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData || []);

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

      // Fetch recent system notifications (filtered by user role)
      const { data: notificationsActivity, error: notificationsError } = await supabase
        .from('user_notifications_with_details')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

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

      if (notificationsActivity) {
        notificationsActivity.forEach((n: any) => {
          allActivity.push({
            id: n.id,
            type: 'notification',
            description: `notification:${n.subject}`, // Will be translated in render
            transaction_title: 'System Announcement', // Not tied to a transaction
            transaction_id: '', // No transaction ID for system notifications
            created_at: n.created_at,
          });
        });
      }

      // Sort by date and take top 10
      allActivity.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecentActivity(allActivity.slice(0, 10));
      setLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }

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
          <CardHeader>
            <CardTitle>{t('transactions.my')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={profile?.role === 'agent' ? 'No transactions yet' : 'No invitations yet'}
                description={profile?.role === 'agent'
                  ? t('dashboard.createFirst')
                  : "You haven't been invited to any transactions yet. Your agent will send you an invitation when they create a transaction."}
                action={profile?.role === 'agent' ? {
                  label: 'Create your first transaction',
                  onClick: () => router.push('/transactions/create')
                } : undefined}
              />
            ) : (
              transactions.map((transaction) => {
                const progress = calculateProgress(transaction);
                return (
                  <Link
                    key={transaction.id}
                    href={`/transaction/${transaction.id}`}
                    className="block rounded border p-3 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{transaction.title}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success capitalize">
                        {transaction.status === 'active' ? t('status.active') : transaction.status === 'completed' ? t('status.completed') : t('status.archived')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Progress value={progress} />
                      <div className="text-xs text-muted-foreground">
                        {progress}% {t('dashboard.complete')}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                {t('dashboard.noActivity')}
              </div>
            ) : (
              recentActivity.map((activity) => {
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
                  displayText = `System: ${value}`;
                }
                
                // For system notifications, don't link to a transaction
                const activityElement = (
                  <div className="flex items-start gap-3 text-sm hover:bg-gray-50 p-2 rounded-md transition-colors">
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
    </div>
  );
}
