'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SendSystemMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientType: 'agents' | 'buyers' | 'all';
  messageType: 'notification' | 'email';
}

export function SendSystemMessageDialog({
  open,
  onOpenChange,
  recipientType,
  messageType,
}: SendSystemMessageDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: { successCount?: number; failureCount?: number };
  } | null>(null);

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({
        success: false,
        message: 'Please fill in both subject and message fields',
      });
      return;
    }

    try {
      setSending(true);
      setResult(null);

      // Get session token
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const endpoint = messageType === 'email'
        ? '/api/super-admin/send-system-email'
        : '/api/super-admin/send-system-notification';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientType,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setResult({
        success: true,
        message: data.message || `Successfully sent ${messageType}`,
        details: data,
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  const recipientLabel = recipientType === 'all' 
    ? 'All Users (Agents & Buyers)' 
    : recipientType === 'agents' 
    ? 'All Agents' 
    : 'All Buyers';

  const messageTypeLabel = messageType === 'email' ? 'Email' : 'In-App Notification';
  const Icon = messageType === 'email' ? Mail : Bell;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Send System {messageTypeLabel}
          </DialogTitle>
          <DialogDescription>
            Send a system-wide {messageType} to <strong>{recipientLabel}</strong>.
            {messageType === 'email' && ' This will send an email to all active users in the selected group.'}
            {messageType === 'notification' && ' This will create an in-app notification for all users in the selected group.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., System Maintenance Notice, New Feature Announcement"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending || result?.success}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              className="w-full min-h-[150px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Write your ${messageType} message here...

Example for outage:
"We will be performing scheduled maintenance on [date] from [time] to [time]. During this period, the platform will be temporarily unavailable. We apologize for any inconvenience."

Example for update:
"We're excited to announce a new feature: [feature name]. You can now [description]. Learn more in your dashboard."`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending || result?.success}
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md border ${
                result.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-1 text-sm flex-1">
                <p className="font-medium">{result.message}</p>
                {result.details && result.details.successCount && (
                  <p className="text-xs">
                    Sent: {result.details.successCount} | Failed: {result.details.failureCount || 0}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim() || result?.success}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Icon className="mr-2 h-4 w-4" />
                Send {messageTypeLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

