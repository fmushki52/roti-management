'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/shared/AppShell';
import { roleHomePath } from '@/lib/auth/roleRedirect';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':      'Dashboard',
  '/admin/requirements':   'Requirements',
  '/admin/approvals':      'Approvals',
  '/admin/users':          'Mumineen',
  '/admin/deliveries':     'Deliveries',
  '/admin/payments':       'Payments',
  '/admin/notifications':  'Notifications',
  '/admin/reports':        'Reports',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.mustChangePassword) { router.replace('/change-password'); return; }
    // Send non-admin roles to their correct home — no redirect loops
    if (user.role !== 'ADMIN') {
      router.replace(roleHomePath(user.role));
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') return null;

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'Admin';

  return (
    <AppShell role="ADMIN" pageTitle={title}>
      {children}
    </AppShell>
  );
}
