'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactionData } from '@/hooks/useTransactionData';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Clock, Users, FileText, MessageCircle, Trash2, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load components that are only visible in specific tabs
const ProgressTracker = dynamic(() => import('@/components/features/transaction/ProgressTracker').then(mod => ({ default: mod.ProgressTracker })));
const InviteBuyerModal = dynamic(() => import('@/components/features/transaction/InviteBuyerModal').then(mod => ({ default: mod.InviteBuyerModal })));
const MessagingPanel = dynamic(() => import('@/components/features/transaction/MessagingPanel').then(mod => ({ default: mod.MessagingPanel })));
const EditTransactionTitleModal = dynamic(() => import('@/components/features/transaction/EditTransactionTitleModal').then(mod => ({ default: mod.EditTransactionTitleModal })));
const TransactionFilesPanel = dynamic(() => import('@/components/features/transaction/TransactionFilesPanel').then(mod => ({ default: mod.TransactionFilesPanel })));
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Milestone } from '@/types';
import { toggleMilestone } from '@/app/actions/transaction';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: PageProps) {
  const { id: transactionId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, tVar, language } = useLanguage();

  // Use custom hook for transaction data management
  const {
    transaction,
    milestones,
    participants,
    messages,
    fileCount,
    loading,
    error,
    refetch
  } = useTransactionData(transactionId);

  const [activeTab, setActiveTab] = useState('tracker');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // Get translated title based on user's language preference
  const getTranslatedTitle = () => {
    if (!transaction) return '';
    const langKey = `title_${language}`;
    return (transaction[langKey as keyof typeof transaction] as string) || transaction.title_en || transaction.title || '';
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleMilestoneToggle = async (milestoneId: string, currentlyCompleted: boolean) => {
    if (profile?.role !== 'agent') return; // Only agents can toggle (frontend check)

    try {
      const result = await toggleMilestone(transactionId, milestoneId, currentlyCompleted);

      if (result.error) {
         throw new Error(result.error);
      }

      // Refresh transaction data
      await refetch();
    } catch (err: any) {
      logger.error('Error updating milestone', { transactionId, milestoneId, error: err.message });
      toast.error('Failed to update milestone', {
        description: err.message
      });
    }
  };

  const handleEmailProgress = async () => {
    if (!supabase || !user) return;

    try {
      setEmailing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/transaction/${transactionId}/email-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast.success('Email sent successfully', {
        description: `Progress update sent to ${user.email}`
      });
    } catch (err: any) {
      logger.error('Error emailing progress', { transactionId, error: err.message });
      toast.error('Failed to send email', {
        description: err.message
      });
    } finally {
      setEmailing(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!supabase || profile?.role !== 'agent' || !transaction) return;

    try {
      setDeleting(true);

      const { data: files } = await supabase
        .from('files')
        .select('storage_path')
        .eq('transaction_id', transaction.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f: any) => f.storage_path).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('transaction_files').remove(filePaths);
        }
      }

      const { error: deleteError } = await supabase.rpc('delete_transaction', {
        p_transaction_id: transaction.id,
      });

      if (deleteError) {
         if (deleteError.code === 'PGRST116' || deleteError.message?.includes('not found')) {
          router.push('/dashboard');
          return;
        }
        
        if (deleteError.message?.includes('function') && deleteError.message?.includes('not found')) {
          const deletePromises = [
            supabase.from('files').delete().eq('transaction_id', transaction.id),
            supabase.from('messages').delete().eq('transaction_id', transaction.id),
            supabase.from('milestones').delete().eq('transaction_id', transaction.id),
            supabase.from('transaction_participants').delete().eq('transaction_id', transaction.id),
            supabase.from('transactions').delete().eq('id', transaction.id),
          ];
          
          const results = await Promise.all(deletePromises);
          const errors = results.filter(r => r.error).map(r => r.error);
          
          if (errors.length > 0) throw errors[0];
        } else {
          throw deleteError;
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      logger.error('Error deleting transaction', { transactionId: transaction.id, error: err.message });
      toast.error(t('transaction.deleteFailed'), {
        description: err.message || 'Unknown error'
      });
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('transaction.error')}</CardTitle>
            <CardDescription>{error || t('transaction.notFound')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('transaction.backToDashboard')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAgent = profile?.role === 'agent';
  const currentMilestone = milestones.filter((m) => m.completed).length;
  const progressTrackerMilestones: Milestone[] = milestones.map((m, index) => ({
    id: index,
    title: m.label_en,
    description: m.label_it || 'Property purchase milestone',
    isCompleted: m.completed,
    completedAt: m.completed_at || undefined,
    order: m.order_index,
  }));

  const handleProgressTrackerToggle = (milestoneIndex: number, currentlyCompleted: boolean) => {
    const milestone = milestones[milestoneIndex];
    if (milestone) {
      handleMilestoneToggle(milestone.id, currentlyCompleted);
    }
  };

  const fileMilestoneOptions = milestones.map((m) => ({
    id: m.id,
    label: language === 'it' ? m.label_it || m.label_en : m.label_en,
  }));
  const canUploadFiles = !!user;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Link href="/dashboard" className="sm:self-start">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to dashboard</span>
          </Button>
        </Link>
        <div className="flex-1 w-full sm:w-auto min-w-0">
          {/* Branding Logo */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{getTranslatedTitle()}</h1>
            <Badge variant={transaction.status === 'active' ? 'default' : 'secondary'}>
              {transaction.status}
            </Badge>
            {isAgent && transaction.created_by === user?.id && (
              <EditTransactionTitleModal transaction={transaction} onSuccess={refetch} />
            )}
          </div>
          {transaction.property_address && (
            <p className="text-muted-foreground mt-1">{transaction.property_address}</p>
          )}
          {transaction.property_url && (
            <p className="mt-2">
              <a
                href={transaction.property_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <FileText className="h-4 w-4" />
                {t('transactions.viewProperty')}
              </a>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {tVar('transaction.createdByOn', { 
              creator: transaction.creator_name, 
              date: new Date(transaction.created_at).toLocaleDateString() 
            })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEmailProgress} 
            disabled={emailing}
          >
            <Mail className="h-4 w-4 mr-2" />
            {emailing ? t('action.sending') || 'Sending...' : t('transaction.emailProgress') || 'Email Progress'}
          </Button>

          {isAgent && transaction.created_by === user?.id && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('transaction.delete')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('transaction.delete')}</DialogTitle>
                <DialogDescription>
                  {t('transaction.deleteConfirm')}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm">
                  <p className="font-semibold text-red-900 mb-2">{t('transaction.deleteWarning')}</p>
                  <ul className="list-disc list-inside text-red-800 space-y-1">
                    <li>{t('transaction.deleteItem1')}</li>
                    <li>{t('transaction.deleteItem2')}</li>
                    <li>{t('transaction.deleteItem3')}</li>
                    <li>{t('transaction.deleteItem4')}</li>
                    <li>{t('transaction.deleteItem5')}</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  Transaction: <span className="font-semibold">{transaction.title}</span>
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                >
                  {t('action.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTransaction}
                  disabled={deleting}
                >
                  {deleting ? t('transaction.deleting') : t('transaction.deleteButton')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">{t('transaction.tracker')}</span>
            <span className="sm:hidden" aria-label={t('transaction.tracker')}>Track</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('transaction.messages')} ({messages.length})</span>
            <span className="sm:hidden">({messages.length})</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('transaction.files')} ({fileCount})</span>
            <span className="sm:hidden">({fileCount})</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('transaction.participants')} ({participants.length})</span>
            <span className="sm:hidden">({participants.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tracker Tab */}
        <TabsContent value="tracker" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('milestones.tracker')}</CardTitle>
                  <CardDescription>
                    {t('milestones.trackerDesc')}
                    {isAgent && ' ' + t('milestones.trackerDescAgent')}
                  </CardDescription>
                </div>
                {isAgent && transaction.created_by === user?.id && (
                  <Link href={`/transaction/${transaction.id}/milestones`}>
                    <Button variant="outline" size="sm">
                      {t('milestones.manage')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ProgressTracker
                milestones={progressTrackerMilestones}
                currentMilestone={currentMilestone}
                isAgent={isAgent && transaction.created_by === user?.id}
                onMilestoneToggle={handleProgressTrackerToggle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('messages.title')}</CardTitle>
              <CardDescription>
                {t('messages.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessagingPanel
                transactionId={transactionId}
                messages={messages}
                onRefresh={refetch}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('files.title')}</CardTitle>
              <CardDescription>
                {t('files.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionFilesPanel
                transactionId={transactionId}
                milestones={fileMilestoneOptions}
                canUpload={canUploadFiles}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('participants.title')}</CardTitle>
              <CardDescription>
                {t('participants.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">{participant.full_name}</div>
                      <div className="text-sm text-muted-foreground">{participant.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('participants.invited')} {new Date(participant.invited_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={participant.participant_role === 'agent' ? 'default' : 'secondary'}>
                      {participant.participant_role === 'agent' ? t('role.agent') : t('role.buyer')}
                    </Badge>
                  </div>
                ))}
              </div>

              {isAgent && (
                <div className="mt-6 flex justify-center">
                  <InviteBuyerModal
                    transactionId={transaction.id}
                    onSuccess={refetch}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}