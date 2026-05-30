'use client';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { apiFetch } from '@/lib/api/fetcher';
import { Notification } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const TYPE_COLORS: Record<string, string> = {
  INFO: 'border-blue-400',
  SUCCESS: 'border-green-400',
  WARNING: 'border-amber-400',
  ALERT: 'border-red-400',
};

export function NotificationBell() {
  useNotificationStream();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadNotifications() {
    const res = await apiFetch<Notification[]>('/api/v1/notifications');
    if (res.success && res.data) setNotifications(res.data.slice(0, 10));
  }

  async function markAllRead() {
    await apiFetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    setUnreadCount(0);
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  }

  useEffect(() => { if (open) loadNotifications(); }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
        <Bell size={20} className="text-[var(--text-on-dark)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[380px] bg-white">
          <SheetHeader>
            <SheetTitle className="font-display text-[var(--brand-brown)]">Notifications</SheetTitle>
          </SheetHeader>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs text-[var(--brand-gold-deep)] mb-2">
              Mark all read
            </Button>
          )}
          <div className="space-y-2 mt-2 overflow-y-auto max-h-[calc(100vh-120px)]">
            {notifications.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-8">No notifications</p>}
            {notifications.map(n => (
              <div key={n.id} className={`p-3 border-l-4 rounded-r-lg bg-gray-50 ${TYPE_COLORS[n.type] || 'border-gray-300'} ${!n.isRead ? 'bg-yellow-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1 flex-shrink-0" />}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
