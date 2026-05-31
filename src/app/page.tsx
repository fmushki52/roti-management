'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.mustChangePassword) {
      router.replace('/change-password');
    } else if (user.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else if (user.role === 'DELIVERY_TEAM') {
      router.replace('/delivery/deliveries');
    } else {
      router.replace('/mumineen/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-page)' }}>
      <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
