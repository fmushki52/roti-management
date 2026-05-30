'use client';
import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

export function useNotificationStream() {
  const { accessToken } = useAuthStore();
  const { setUnreadCount, incrementUnread } = useNotificationStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    function connect() {
      const es = new EventSource(`/api/v1/notifications/stream?token=${accessToken}`);
      esRef.current = es;

      es.addEventListener('unread-count', (e) => {
        setUnreadCount(JSON.parse(e.data).count);
      });

      es.addEventListener('new-notification', () => {
        incrementUnread();
      });

      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => esRef.current?.close();
  }, [accessToken]);
}
