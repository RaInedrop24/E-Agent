import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useBranding } from '@/contexts/BrandingContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Transaction {
  id: string;
  title: string;
  title_en?: string | null;
  title_it?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  agent_reference?: string | null;
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
  translated_text?: Record<string, string> | null;
  created_at: string;
}

interface UseTransactionDataReturn {
  transaction: Transaction | null;
  milestones: TransactionMilestone[];
  participants: Participant[];
  messages: Message[];
  fileCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage transaction data fetching and state
 *
 * Consolidates all transaction-related data fetching logic:
 * - Transaction details with branding
 * - Milestones
 * - Participants
 * - Messages
 * - File count
 * - Access control (creator, participant, super admin)
 *
 * @param transactionId - The ID of the transaction to fetch
 * @returns Transaction data, loading state, error, and refetch function
 */
export function useTransactionData(transactionId: string): UseTransactionDataReturn {
  const { user } = useAuth();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const { setBranding } = useBranding();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [milestones, setMilestones] = useState<TransactionMilestone[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!user || superAdminLoading || !supabase) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
          agent_reference,
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

      // Check access: user must be either creator OR a participant OR super admin
      const isCreator = txData.created_by === user.id;

      if (!isCreator && !isSuperAdmin) {
        // Check if user is a participant
        const { data: participantCheck } = await supabase
          .from('transaction_participants')
          .select('id')
          .eq('transaction_id', transactionId)
          .eq('profile_id', user.id)
          .maybeSingle();

        if (!participantCheck) {
          setError('You do not have access to this transaction');
          setLoading(false);
          return;
        }
      }

      const agentProfile = txData.profiles as any;
      const transactionData: Transaction = {
        ...txData,
        creator_name: agentProfile?.full_name || 'Unknown',
        agent_branding: {
          logo: agentProfile?.branding_logo_url,
          colors: agentProfile?.branding_settings
        }
      };

      setTransaction(transactionData);

      // Apply branding
      if (transactionData.agent_branding) {
        const { logo, colors } = transactionData.agent_branding;
        setBranding(logo || null, colors as any || null);
      }

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
        // Fallback to direct query if RPC fails
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

      // Fetch messages with translated_text field
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          author_profile_id,
          content_original,
          content_translated,
          original_language,
          translated_language,
          translated_text,
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
        logger.warn('Error fetching file count', { transactionId, error: filesCountError.message });
      } else {
        setFileCount(filesCount || 0);
      }

      setLoading(false);
    } catch (err: any) {
      logger.error('Failed to load transaction data', { transactionId, error: err.message });
      setError(err.message || 'Failed to load transaction');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, user, isSuperAdmin, superAdminLoading]);

  useEffect(() => {
    if (user && !superAdminLoading) {
      fetchTransaction();
    }
  }, [fetchTransaction, user, superAdminLoading]);

  return {
    transaction,
    milestones,
    participants,
    messages,
    fileCount,
    loading,
    error,
    refetch: fetchTransaction,
  };
}
