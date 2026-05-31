'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/shared/AppShell';
import { roleHomePath } from '@/lib/auth/roleRedirect';

const PAGE_TITLES: Record<string, string> = {
  '/mumineen/dashboard':      'My Dashboard',
  '/mumineen/requirements':   'Requirements',
  '/mumineen/my-commitments': 'My Commitments',
  '/mumineen/notifications':  'Notifications',
};

export default function MumineenLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.mustChangePassword) { router.replace('/change-password'); return; }
    // Send non-mumineen roles to their correct home — no redirect loops
    if (user.role !== 'MUMINEEN') {
      router.replace(roleHomePath(user.role));
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'MUMINEEN') return null;
  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'Dashboard';

  return (
    <AppShell role="MUMINEEN" pageTitle={title}>
      {children}
    </AppShell>
  );
}
