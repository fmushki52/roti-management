import { ApiResponse } from './response';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        headers['Authorization'] = `Bearer ${data.data.accessToken}`;
        const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        return retryRes.json();
      }
    }
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return res.json();
}
