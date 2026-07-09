'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime } from '@/lib/date-utils';

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: {
    subject: string;
    message: string;
    original_subject?: string;
    original_message?: string;
    created_at: string;
  } | null;
}

export function NotificationModal({ open, onOpenChange, notification }: NotificationModalProps) {
  if (!notification) return null;

  const hasOriginal = notification.original_subject && notification.original_message;
  const showOriginal = notification.subject !== notification.original_subject;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{notification.subject}</DialogTitle>
          <DialogDescription>
            {formatRelativeTime(notification.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {notification.message}
            </div>
          </div>

          {hasOriginal && showOriginal && (
            <div className="border-t pt-4 mt-4">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Show Original (English)
                </summary>
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm">{notification.original_subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Message:</p>
                    <p className="text-sm whitespace-pre-wrap">{notification.original_message}</p>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

