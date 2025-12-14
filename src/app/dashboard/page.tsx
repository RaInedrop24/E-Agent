'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, MessageSquare, FileText, Clock } from "lucide-react";

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
  type: 'milestone' | 'message' | 'file';
  description: string;
  transaction_title: string;
  transaction_id: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { t, tVar } = useLanguage();
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

  function calculateProgress(transaction: Transaction): number {
    if (!transaction.milestones || transaction.milestones.length === 0) {
      return 0;
    }
    const completed = transaction.milestones.filter(m => m.completed).length;
    return Math.round((completed / transaction.milestones.length) * 100);
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'milestone':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'file':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
        <div className="text-muted-foreground">Loading your transactions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
        {profile?.role === 'agent' && (
          <div className="flex gap-2">
            <Link
              href="/buyers"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              {t('buyers.manage')}
            </Link>
            <Link
              href="/transactions/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {t('transactions.create')}
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('transactions.my')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                {profile?.role === 'agent'
                  ? t('dashboard.createFirst')
                  : "You haven't been invited to any transactions yet."}
              </div>
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
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize">
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
                }
                
                return (
                  <Link
                    key={activity.id}
                    href={`/transaction/${activity.transaction_id}`}
                    className="flex items-start gap-3 text-sm hover:bg-gray-50 p-2 rounded-md transition-colors"
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
                      {formatDate(activity.created_at)}
                    </div>
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
