'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Fix #1: On every page load, refresh the access token using the HTTP-only cookie
// so that users are not locked out after the 15-min token expiry
export function AuthInitializer() {
  const { user, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    async function refreshSession() {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        const json = await res.json();
        if (json.success && json.data?.accessToken) {
          localStorage.setItem('accessToken', json.data.accessToken);
          setAuth(user!, json.data.accessToken);
        } else {
          clearAuth();
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
      } catch {
        // Network error — keep existing session, will fail gracefully on next API call
      }
    }

    refreshSession();
  // Only run on initial mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
