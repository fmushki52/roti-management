'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Notification } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const TYPE_CONFIG: Record<string, { bg: string; border: string; label: string }> = {
  INFO:    { bg: 'bg-blue-50',   border: 'border-blue-400',  label: 'Info' },
  SUCCESS: { bg: 'bg-green-50',  border: 'border-green-400', label: 'Success' },
  WARNING: { bg: 'bg-amber-50',  border: 'border-amber-400', label: 'Warning' },
  ALERT:   { bg: 'bg-red-50',    border: 'border-red-400',   label: 'Alert' },
};

export default function MumineenNotificationsPage() {
  const qc = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<(Notification & { senderName?: string })[]>('/api/v1/notifications'),
  });

  const notifications = data?.data || [];

  async function markAllRead() {
    await apiFetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    setUnreadCount(0);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markRead(id: string) {
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Notifications {unreadCount > 0 && <span className="text-sm text-[var(--brand-gold-deep)]">({unreadCount} unread)</span>}
        </h2>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} style={{ color: 'var(--brand-gold-deep)' }}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[var(--brand-gold-light)] animate-pulse rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg" style={{ fontFamily: 'Amiri, serif' }}>No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`p-4 border-l-4 rounded-r-xl ${cfg.border} ${cfg.bg} ${!n.isRead ? 'cursor-pointer' : ''} transition-opacity`}
                style={{ opacity: n.isRead ? 0.75 : 1 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      From {(n as any).senderName || 'Admin'} • {format(new Date(n.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} font-medium`}>{cfg.label}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[var(--brand-gold)]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
