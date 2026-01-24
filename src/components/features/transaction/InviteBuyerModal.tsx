'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Buyer {
  id: string;
  full_name: string;
}

interface InviteBuyerModalProps {
  transactionId: string;
  onSuccess?: () => void;
}

export function InviteBuyerModal({ transactionId, onSuccess }: InviteBuyerModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchBuyers();
    }
  }, [open]);

  const fetchBuyers = async () => {
    try {
      setLoadingBuyers(true);
      setError(null);

      // Get current user to fetch their associated buyers
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in');
        return;
      }

      // Fetch buyers associated with this agent
      const { data: associations, error: fetchError } = await supabase
        .from('buyer_agent_associations')
        .select(`
          buyer_id,
          profiles!buyer_agent_associations_buyer_id_fkey (
            id,
            full_name
          )
        `)
        .eq('agent_id', user.id);

      if (fetchError) throw fetchError;

      const buyersList = (associations || []).map((a: any) => ({
        id: (a.profiles as any).id,
        full_name: (a.profiles as any).full_name || 'Unknown Buyer',
      }));

      setBuyers(buyersList);
    } catch (err: any) {
      setError('Failed to load buyers. Please try again.');
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBuyerId) {
      setError('Please select a buyer');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('add_buyer_to_transaction_by_id', {
        p_transaction_id: transactionId,
        p_buyer_id: selectedBuyerId,
      });

      if (rpcError) throw rpcError;

      // The RPC returns a JSON object with success/message
      const result = data as { success: boolean; message: string };

      if (!result.success) {
        throw new Error(result.message);
      }

      setSuccess('Buyer added successfully!');
      setSelectedBuyerId('');

      // Call the onSuccess callback to refresh parent component
      if (onSuccess) {
        onSuccess();
      }

      // Close after a brief delay
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to invite buyer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('buyers.inviteButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('buyers.inviteTitle')}</DialogTitle>
          <DialogDescription>
            {t('buyers.inviteDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="buyer">{t('buyers.selectBuyer')}</Label>
              {loadingBuyers ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('buyers.loading')}
                </div>
              ) : buyers.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                  {t('buyers.noAvailable')}
                </div>
              ) : (
                <Combobox
                  options={buyers.map(b => ({
                    value: b.id,
                    label: b.full_name
                  }))}
                  value={selectedBuyerId}
                  onSelect={(buyerId) => {
                    setSelectedBuyerId(buyerId);
                    setError(null);
                  }}
                  placeholder={t('buyers.searchPlaceholder')}
                  emptyMessage={t('buyers.noneFound')}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-green-500 bg-green-50 p-2 rounded">
              {success}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !selectedBuyerId || loadingBuyers}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('buyers.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
