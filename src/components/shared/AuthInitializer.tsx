'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthInitializer() {
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Silently try to get a fresh access token using the HTTP-only refresh cookie.
    // If it fails for any reason, keep the existing session — the user will only
    // be redirected to login when they actually hit a 401 on a real API call.
    async function refreshSession() {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return; // Refresh failed — keep existing token, don't log out
        const json = await res.json();
        if (json.success && json.data?.accessToken) {
          localStorage.setItem('accessToken', json.data.accessToken);
          setAuth(user!, json.data.accessToken);
        }
        // No else — if refresh returns a non-success body, just keep existing session
      } catch {
        // Network error — keep existing session
      }
    }

    refreshSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
