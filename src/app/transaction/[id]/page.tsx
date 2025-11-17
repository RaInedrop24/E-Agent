'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Clock, Users, FileText, MessageCircle } from 'lucide-react';
import { ProgressTracker } from '@/components/features/transaction/ProgressTracker';
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
  original_language: string;
  created_at: string;
}

interface PageProps {
  params: { id: string };
}

export default function TransactionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [milestones, setMilestones] = useState<TransactionMilestone[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracker');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTransaction();
  }, [user, params.id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Check if user is a participant
      const { data: participantCheck } = await supabase
        .from('transaction_participants')
        .select('id')
        .eq('transaction_id', params.id)
        .eq('profile_id', user!.id)
        .single();

      if (!participantCheck) {
        setError('You do not have access to this transaction');
        setLoading(false);
        return;
      }

      // Fetch transaction details
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
        .eq('id', params.id)
        .single();

      if (txError) throw txError;

      setTransaction({
        ...txData,
        creator_name: (txData.profiles as any)?.full_name || 'Unknown',
      });

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('transaction_id', params.id)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('transaction_participants')
        .select(`
          id,
          profile_id,
          participant_role,
          invited_at,
          profiles (
            full_name,
            id
          )
        `)
        .eq('transaction_id', params.id);

      if (participantsError) throw participantsError;

      // Fetch emails from auth.users for participants
      const participantsWithDetails = await Promise.all(
        (participantsData || []).map(async (p: any) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(p.profile_id);
          return {
            id: p.id,
            profile_id: p.profile_id,
            participant_role: p.participant_role,
            full_name: p.profiles?.full_name || 'Unknown',
            email: authUser?.user?.email || 'unknown@example.com',
            invited_at: p.invited_at,
          };
        })
      );

      setParticipants(participantsWithDetails);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          author_profile_id,
          content_original,
          original_language,
          created_at,
          profiles!messages_author_profile_id_fkey (
            full_name
          )
        `)
        .eq('transaction_id', params.id)
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
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Transaction not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
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
            Created by {transaction.creator_name} on{' '}
            {new Date(transaction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants ({participants.length})
          </TabsTrigger>
        </TabsList>

        {/* Tracker Tab */}
        <TabsContent value="tracker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracker</CardTitle>
              <CardDescription>
                Track the key milestones of this property purchase.
                {isAgent && ' Click on a milestone to mark it as complete.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressTracker
                milestones={progressTrackerMilestones}
                currentMilestone={currentMilestone}
              />

              {isAgent && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">Manage Milestones</h3>
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            milestone.completed
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
                              Completed {new Date(milestone.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={milestone.completed ? 'outline' : 'default'}
                        onClick={() => handleMilestoneToggle(milestone.id, milestone.completed)}
                      >
                        {milestone.completed ? 'Mark Incomplete' : 'Mark Complete'}
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
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communication between transaction participants.
                <span className="block mt-1 text-xs text-blue-600">
                  Translation feature coming soon (requires DeepL API key)
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{message.author_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">{message.content_original}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Language: {message.original_language.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Files & Documents</CardTitle>
              <CardDescription>
                Documents and files related to this transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4">File upload feature coming soon</p>
                <p className="text-sm">Upload contracts, surveys, and other documents</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                Users involved in this transaction
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
                        Invited {new Date(participant.invited_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={participant.participant_role === 'agent' ? 'default' : 'secondary'}>
                      {participant.participant_role}
                    </Badge>
                  </div>
                ))}
              </div>

              {isAgent && (
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Invite Buyer
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Invite functionality coming soon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
