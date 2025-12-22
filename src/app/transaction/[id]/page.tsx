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
import { ArrowLeft, Check, Clock, Users, FileText, MessageCircle, Trash2, Mail } from 'lucide-react';
import { ProgressTracker } from '@/components/features/transaction/ProgressTracker';
import { InviteBuyerModal } from '@/components/features/transaction/InviteBuyerModal';
import { MessagingPanel } from '@/components/features/transaction/MessagingPanel';
import { EditTransactionTitleModal } from '@/components/features/transaction/EditTransactionTitleModal';
import { TransactionFilesPanel } from '@/components/features/transaction/TransactionFilesPanel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Milestone } from '@/types';
import { useBranding } from '@/contexts/BrandingContext';
import { toggleMilestone } from '@/app/actions/transaction';

interface Transaction {
  id: string;
  title: string;
  title_en?: string | null;
  title_it?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  property_address: string | null;
  property_url: string | null;
  status: string;
  created_at: string;
  created_by: string;
  creator_name: string;
  agent_branding?: {
    logo?: string | null;
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
    };
  };
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
  const { t, tVar, language } = useLanguage();
  const { setBranding } = useBranding();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [milestones, setMilestones] = useState<TransactionMilestone[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracker');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailing, setEmailing] = useState(false);

  // Get translated title based on user's language preference
  const getTranslatedTitle = () => {
    if (!transaction) return '';
    const langKey = `title_${language}` as keyof Transaction;
    return (transaction[langKey] as string) || transaction.title_en || transaction.title || '';
  };

  // Apply branding
  useEffect(() => {
    if (transaction?.agent_branding) {
      const { logo, colors } = transaction.agent_branding;
      // Update global branding context (Header + Colors)
      setBranding(logo || null, colors as any || null);
    }
    
    // Cleanup function to reset (optional, but good for SPA navigation)
    return () => {
      // If we leave the page, we might want to reset to the logged-in user's branding
      // But BrandingContext doesn't auto-reset yet. For now, this is acceptable.
      // Ideally, BrandingContext should listen to the URL or Auth state to reset.
    };
  }, [transaction, setBranding]);

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
          title_en,
          title_it,
          title_de,
          title_fr,
          title_es,
          property_address,
          property_url,
          status,
          created_at,
          created_by,
          profiles!transactions_created_by_fkey (
            full_name,
            branding_logo_url,
            branding_settings
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

      const agentProfile = txData.profiles as any;
      setTransaction({
        ...txData,
        creator_name: agentProfile?.full_name || 'Unknown',
        agent_branding: {
          logo: agentProfile?.branding_logo_url,
          colors: agentProfile?.branding_settings
        }
      });

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch participants
      let participantsData: any[] = [];
      const { data: rpcData, error: participantsError } = await supabase
        .rpc('get_transaction_participants', {
          p_transaction_id: transactionId
        });

      if (participantsError) {
        console.warn('[TransactionDetail] Participants RPC failed, using fallback:', participantsError);
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
          throw new Error(`Failed to fetch participants: ${fallbackError.message}`);
        }

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

      // Fetch file count
      const { count: filesCount, error: filesCountError } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('transaction_id', transactionId);

      if (filesCountError) {
        console.warn('[TransactionDetail] Error fetching file count:', filesCountError);
      } else {
        setFileCount(filesCount || 0);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('[TransactionDetail] Error:', err);
      setError(err.message || 'Failed to load transaction');
      setLoading(false);
    }
  };

  const handleMilestoneToggle = async (milestoneId: string, currentlyCompleted: boolean) => {
    if (!profile?.role === 'agent') return; // Only agents can toggle (frontend check)

    try {
      const result = await toggleMilestone(transactionId, milestoneId, currentlyCompleted);
      
      if (result.error) {
         throw new Error(result.error);
      }

      // Refresh milestones
      await fetchTransaction();
    } catch (err: any) {
      console.error('[TransactionDetail] Error updating milestone:', err);
      alert('Failed to update milestone: ' + err.message);
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

      alert('Transaction progress email sent successfully to ' + user.email);
    } catch (err: any) {
      console.error('[TransactionDetail] Error emailing progress:', err);
      alert('Failed to send email: ' + err.message);
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
      console.error('[TransactionDetail] Error deleting transaction:', err);
      alert(t('transaction.deleteFailed') + ': ' + (err.message || 'Unknown error'));
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
      <div className="flex items-start gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          {/* Branding Logo */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{getTranslatedTitle()}</h1>
            <Badge variant={transaction.status === 'active' ? 'default' : 'secondary'}>
              {transaction.status}
            </Badge>
            {isAgent && transaction.created_by === user?.id && (
              <EditTransactionTitleModal transaction={transaction} onSuccess={fetchTransaction} />
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
        <div className="flex gap-2">
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
            {t('transaction.tracker')}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {t('transaction.messages')} ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('transaction.files')} ({fileCount})
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