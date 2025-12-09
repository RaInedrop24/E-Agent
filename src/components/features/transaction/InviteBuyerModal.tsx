'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InviteBuyerModalProps {
  transactionId: string;
}

export function InviteBuyerModal({ transactionId }: InviteBuyerModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('add_buyer_to_transaction', {
        p_transaction_id: transactionId,
        p_buyer_email: email,
      });

      if (rpcError) throw rpcError;

      // The RPC returns a JSON object with success/message
      // We need to cast it or check the structure. 
      // Based on our SQL: { success: boolean, message: string }
      const result = data as { success: boolean; message: string };

      if (!result.success) {
        throw new Error(result.message);
      }

      setSuccess('Buyer added successfully!');
      setEmail('');
      router.refresh(); // Refresh to show the new participant
      
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
          Invite Buyer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Buyer</DialogTitle>
          <DialogDescription>
            Enter the email address of the buyer you want to add to this transaction. 
            They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@example.com"
                className="col-span-3"
                required
              />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
