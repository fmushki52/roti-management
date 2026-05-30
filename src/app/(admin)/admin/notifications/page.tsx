'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { User, Notification } from '@/types';
import { NotificationComposer } from '@/components/admin/NotificationComposer';
import { format } from 'date-fns';

const TYPE_COLORS: Record<string, string> = {
  INFO: 'border-blue-400 bg-blue-50',
  SUCCESS: 'border-green-400 bg-green-50',
  WARNING: 'border-amber-400 bg-amber-50',
  ALERT: 'border-red-400 bg-red-50',
};

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const { data: usersRes } = useQuery({ queryKey: ['users'], queryFn: () => apiFetch<User[]>('/api/v1/users') });
  const { data: notifRes } = useQuery({ queryKey: ['notifications'], queryFn: () => apiFetch<Notification[]>('/api/v1/notifications') });

  const mumineen = (usersRes?.data || []).filter(u => u.role === 'MUMINEEN');
  const notifications = notifRes?.data || [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
        Notifications
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)' }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Compose</h3>
          <NotificationComposer users={mumineen} onSent={() => qc.invalidateQueries({ queryKey: ['notifications'] })} />
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)' }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Sent History</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {notifications.slice(0, 50).map(n => (
              <div key={n.id} className={`p-3 border-l-4 rounded-r-lg ${TYPE_COLORS[n.type] || 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {n.recipientId ? 'Personal' : 'Broadcast'}
                  </span>
                </div>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{format(new Date(n.createdAt), 'dd MMM yyyy HH:mm')}</p>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">No notifications sent yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
