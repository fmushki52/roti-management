'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.mustChangePassword) { router.replace('/change-password'); return; }
    if (!['ADMIN', 'DELIVERY_TEAM'].includes(user.role)) { router.replace('/mumineen/dashboard'); return; } // Mumineen only
  }, [user, router]);

  if (!user || !['ADMIN', 'DELIVERY_TEAM'].includes(user.role)) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-page)' }}>
      <header className="h-14 flex items-center justify-between px-4 md:px-6" style={{ background: 'var(--surface-sidebar)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="FMB Logo" width={90} height={36} className="object-contain" />
          <span className="text-sm font-semibold hidden md:block" style={{ color: 'var(--text-on-dark)' }}>
            Delivery Team
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={logout} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-on-dark)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
