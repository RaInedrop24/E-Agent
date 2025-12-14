'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Clock, Users, FileText, MessageCircle, Trash2 } from 'lucide-react';
import { ProgressTracker } from '@/components/features/transaction/ProgressTracker';
import { InviteBuyerModal } from '@/components/features/transaction/InviteBuyerModal';
import { MessagingPanel } from '@/components/features/transaction/MessagingPanel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Milestone } from '@/types';

interface Transaction {
  id: string;
  title: string;
  property_address: string | null;
  status: string;
  created_at: string;
  created_by: string;
  creator_name: string;
}

interface Participant {
  id: string;
  profile_id: string;
  participant_role: string;
  full_name: string;
  email: string;
  invited_at: string;
}

interface TransactionMilestone {
  id: string;
  order_index: number;
  code: string;
  label_en: string;
  label_it: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

interface Message {
  id: string;
  author_profile_id: string;
  author_name: string;
  content_original: string;
  content_translated: string | null;
  original_language: string;
  translated_language: string | null;
  created_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: PageProps) {
  const { id: transactionId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, tVar } = useLanguage();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [milestones, setMilestones] = useState<TransactionMilestone[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracker');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTransaction();
  }, [user, transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Fetch transaction details first to check if user is creator
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          title,
          property_address,
          status,
          created_at,
          created_by,
          profiles!transactions_created_by_fkey (
            full_name
          )
        `)
        .eq('id', transactionId)
        .single();

      if (txError) {
        if (txError.code === 'PGRST116') {
          setError('Transaction not found');
        } else {
          throw txError;
        }
        setLoading(false);
        return;
      }

      if (!txData) {
        setError('Transaction not found');
        setLoading(false);
        return;
      }

      // Check access: user must be either creator OR a participant
      const isCreator = txData.created_by === user!.id;
      
      if (!isCreator) {
        // Check if user is a participant
        const { data: participantCheck } = await supabase
          .from('transaction_participants')
          .select('id')
          .eq('transaction_id', transactionId)
          .eq('profile_id', user!.id)
          .single();

        if (!participantCheck) {
          setError('You do not have access to this transaction');
          setLoading(false);
          return;
        }
      }

      setTransaction({
        ...txData,
        creator_name: (txData.profiles as any)?.full_name || 'Unknown',
      });

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch participants using RPC function that has access to auth.users
      let participantsData: any[] = [];
      const { data: rpcData, error: participantsError } = await supabase
        .rpc('get_transaction_participants', {
          p_transaction_id: transactionId
        });

      if (participantsError) {
        console.warn('[TransactionDetail] Participants RPC failed, using fallback:', participantsError);

        // Fallback: fetch without emails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('transaction_participants')
          .select(`
            id,
            profile_id,
            participant_role,
            invited_at,
            profiles (
              full_name
            )
          `)
          .eq('transaction_id', transactionId);

        if (fallbackError) {
          console.error('[TransactionDetail] Fallback fetch also failed:', fallbackError);
          throw new Error(`Failed to fetch participants: ${fallbackError.message}`);
        }

        // Map fallback data to expected format (without real emails)
        participantsData = (fallbackData || []).map((p: any) => ({
          id: p.id,
          profile_id: p.profile_id,
          participant_role: p.participant_role,
          full_name: p.profiles?.full_name || 'Unknown',
          email: 'Please apply SQL migration to see emails',
          invited_at: p.invited_at,
        }));
      } else {
        participantsData = rpcData || [];
      }

      setParticipants(participantsData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          author_profile_id,
          content_original,
          content_translated,
          original_language,
          translated_language,
          created_at,
          profiles!messages_author_profile_id_fkey (
            full_name
          )
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(
        (messagesData || []).map((m: any) => ({
          ...m,
          author_name: m.profiles?.full_name || 'Unknown',
        }))
      );

      setLoading(false);
    } catch (err: any) {
      console.error('[TransactionDetail] Error:', err);
      setError(err.message || 'Failed to load transaction');
      setLoading(false);
    }
  };

  const handleMilestoneToggle = async (milestoneId: string, currentlyCompleted: boolean) => {
    if (!supabase || profile?.role !== 'agent') return;

    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          completed: !currentlyCompleted,
          completed_at: !currentlyCompleted ? new Date().toISOString() : null,
          completed_by: !currentlyCompleted ? user!.id : null,
        })
        .eq('id', milestoneId);

      if (error) throw error;

      // Refresh milestones
      await fetchTransaction();
    } catch (err: any) {
      console.error('[TransactionDetail] Error updating milestone:', err);
      alert('Failed to update milestone: ' + err.message);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!supabase || profile?.role !== 'agent' || !transaction) return;

    try {
      setDeleting(true);

      // Delete in order due to foreign key constraints:
      // 1. Delete files from storage (if any exist)
      const { data: files } = await supabase
        .from('files')
        .select('storage_path')
        .eq('transaction_id', transaction.id);

      if (files && files.length > 0) {
        // Delete files from storage bucket
        const filePaths = files.map((f: any) => f.storage_path);
        await supabase.storage.from('transaction-files').remove(filePaths);
      }

      // 2. Delete files records
      await supabase
        .from('files')
        .delete()
        .eq('transaction_id', transaction.id);

      // 3. Delete messages
      await supabase
        .from('messages')
        .delete()
        .eq('transaction_id', transaction.id);

      // 4. Delete milestones
      await supabase
        .from('milestones')
        .delete()
        .eq('transaction_id', transaction.id);

      // 5. Delete participants
      await supabase
        .from('transaction_participants')
        .delete()
        .eq('transaction_id', transaction.id);

      // 6. Finally, delete the transaction itself
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('[TransactionDetail] Error deleting transaction:', err);
      alert('Failed to delete transaction: ' + err.message);
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

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{transaction.title}</h1>
            <Badge variant={transaction.status === 'active' ? 'default' : 'secondary'}>
              {transaction.status}
            </Badge>
          </div>
          {transaction.property_address && (
            <p className="text-muted-foreground mt-1">{transaction.property_address}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {tVar('transaction.createdByOn', { 
              creator: transaction.creator_name, 
              date: new Date(transaction.created_at).toLocaleDateString() 
            })}
          </p>
        </div>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {t('transaction.tracker')}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {t('transaction.messages')} ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('transaction.files')}
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('transaction.participants')} ({participants.length})
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
              />

              {isAgent && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">{t('milestones.manage')}</h3>
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.completed
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}
                        >
                          {milestone.completed && <Check className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{milestone.label_en}</div>
                          {milestone.completed_at && (
                            <div className="text-xs text-muted-foreground">
                              {t('milestones.completed')} {new Date(milestone.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={milestone.completed ? 'outline' : 'default'}
                        onClick={() => handleMilestoneToggle(milestone.id, milestone.completed)}
                      >
                        {milestone.completed ? t('milestones.markIncomplete') : t('milestones.markComplete')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                onRefresh={fetchTransaction}
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
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4">{t('files.comingSoon')}</p>
                <p className="text-sm">{t('files.uploadContracts')}</p>
              </div>
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
                    onSuccess={fetchTransaction}
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
