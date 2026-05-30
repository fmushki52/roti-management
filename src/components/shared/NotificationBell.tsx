'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { apiFetch } from '@/lib/api/fetcher';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const TYPE_COLORS: Record<string, string> = {
  INFO:    'border-blue-400',
  SUCCESS: 'border-green-400',
  WARNING: 'border-amber-400',
  ALERT:   'border-red-400',
};

export function NotificationBell() {
  useNotificationStream();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    const res = await apiFetch<(Notification & { senderName?: string })[]>('/api/v1/notifications');
    if (res.success && res.data) setNotifications(res.data.slice(0, 10));
  }

  async function markAllRead() {
    await apiFetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    setUnreadCount(0);
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  }

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-[var(--text-on-dark)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — issue #7: dropdown not drawer */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{ borderColor: 'var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'var(--border-default)', background: 'var(--brand-cream)' }}>
            <span className="font-semibold text-sm" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--brand-gold-deep)' }}>({unreadCount})</span>}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1 rounded hover:bg-white transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[360px]">
            {notifications.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`px-4 py-3 border-l-4 border-b ${TYPE_COLORS[n.type] || 'border-gray-300'} ${!n.isRead ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'} transition-colors`}
                  style={{ borderBottomColor: 'var(--border-default)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[var(--brand-gold)] flex-shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
