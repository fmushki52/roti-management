'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/** Decode JWT payload without verifying (client-safe — tokens are public) */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthInitializer() {
  const { user, accessToken, setAuth } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    async function refreshIfNeeded() {
      // Only refresh if token is missing or expires within the next 10 minutes
      const expiry = accessToken ? getTokenExpiry(accessToken) : null;
      const expiresInMs = expiry ? expiry - Date.now() : 0;
      const needsRefresh = !accessToken || expiresInMs < 10 * 60 * 1000;

      if (!needsRefresh) return; // Token is still fresh — no action needed

      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return; // Refresh failed — keep existing session, don't log out
        const json = await res.json();
        if (json.success && json.data?.accessToken) {
          localStorage.setItem('accessToken', json.data.accessToken);
          setAuth(user!, json.data.accessToken);
        }
      } catch {
        // Network error — keep existing session
      }
    }

    refreshIfNeeded();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
