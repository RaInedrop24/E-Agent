'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/date-utils';
import { logger } from '@/lib/logger';
import { NotificationModal } from './NotificationModal';

interface Notification {
  id: string;
  announcement_id: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  subject: string;
  message: string;
  message_type: string;
  sent_at: string;
  original_subject?: string;
  original_message?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isMounted) return;

        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok || !isMounted) {
          return;
        }

        const data = await response.json();
        const allNotifications = data.notifications || [];

        // Filter to show: all unread + last 10 read
        const unread = allNotifications.filter((n: Notification) => !n.read);
        const read = allNotifications.filter((n: Notification) => n.read).slice(0, 10);
        const filteredNotifications = [...unread, ...read];

        if (isMounted) {
          setNotifications(filteredNotifications);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error: any) {
        if (isMounted) {
          logger.error('Error fetching notifications', { error: error.message });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    // Set up Realtime subscription for new notifications
    if (!supabase) return;

    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`, // 🔥 PERFORMANCE FIX: Only listen to MY notifications
        },
        () => {
          // New notification received - refresh
          if (isMounted) fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`, // 🔥 PERFORMANCE FIX: Only listen to MY notifications
        },
        () => {
          // Notification updated (probably marked as read) - refresh
          if (isMounted) fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      logger.error('Error marking notification as read', { notificationId, error: error.message });
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error: any) {
      logger.error('Error marking all notifications as read', { error: error.message });
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0
            ? `Notifications - ${unreadCount > 9 ? 'more than 9' : unreadCount} unread`
            : 'Notifications'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              aria-label={`${unreadCount > 9 ? 'more than 9' : unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-info/10 hover:bg-info/20' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  // Open modal to view full message
                  setSelectedNotification(notification);
                  setNotificationModalOpen(true);
                  setOpen(false); // Close dropdown
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-info' : ''}`}>
                        {notification.subject}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-info flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>

      <NotificationModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
        notification={selectedNotification ? {
          subject: selectedNotification.subject,
          message: selectedNotification.message,
          original_subject: (selectedNotification as any).original_subject,
          original_message: (selectedNotification as any).original_message,
          created_at: selectedNotification.created_at,
        } : null}
      />
    </DropdownMenu>
  );
}

