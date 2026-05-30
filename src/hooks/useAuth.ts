'use client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetcher';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  async function logout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    clearAuth();
    router.push('/login');
  }

  return { user, accessToken, logout, isAuthenticated: !!user };
}
