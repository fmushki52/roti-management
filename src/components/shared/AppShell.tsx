'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import Image from 'next/image';
import {
  LayoutDashboard, ListChecks, Users, Truck, Bell, BarChart2,
  ChevronLeft, ChevronRight, LogOut, CheckSquare, CreditCard,
} from 'lucide-react';

interface NavItem { label: string; href: string; icon: React.ReactNode; mobileHidden?: boolean }

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/admin/dashboard',      icon: <LayoutDashboard size={18} /> },
  { label: 'Requirements',  href: '/admin/requirements',   icon: <ListChecks size={18} /> },
  { label: 'Approvals',     href: '/admin/approvals',      icon: <CheckSquare size={18} /> },
  { label: 'Mumineen',      href: '/admin/users',          icon: <Users size={18} /> },
  { label: 'Deliveries',    href: '/admin/deliveries',     icon: <Truck size={18} /> },
  { label: 'Payments',      href: '/admin/payments',       icon: <CreditCard size={18} />, mobileHidden: true },
  { label: 'Notifications', href: '/admin/notifications',  icon: <Bell size={18} />, mobileHidden: true },
  { label: 'Reports',       href: '/admin/reports',        icon: <BarChart2 size={18} />, mobileHidden: true },
];

const MUMINEEN_NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/mumineen/dashboard',       icon: <LayoutDashboard size={18} /> },
  { label: 'Requirements',  href: '/mumineen/requirements',    icon: <ListChecks size={18} /> },
  { label: 'Commitments',   href: '/mumineen/my-commitments',  icon: <ListChecks size={18} /> },
  // Notifications hidden from mobile bottom nav — bell icon in header is sufficient
  { label: 'Notifications', href: '/mumineen/notifications',   icon: <Bell size={18} />, mobileHidden: true },
];

interface Props {
  role: 'ADMIN' | 'MUMINEEN';
  pageTitle: string;
  children: React.ReactNode;
}

export function AppShell({ role, pageTitle, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const nav = role === 'ADMIN' ? ADMIN_NAV : MUMINEEN_NAV;
  const mobileNav = nav.filter(n => !n.mobileHidden);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-page)]">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col bg-[var(--surface-sidebar)] transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
          {!collapsed && (
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <Image src="/logo.png" alt="FMB Logo" width={160} height={64} className="object-contain" style={{ maxHeight: 52 }} />
              <p className="text-[10px] leading-tight pl-0.5" style={{ color: 'var(--text-muted)' }}>ROTI Management</p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-[var(--brand-gold)] flex items-center justify-center text-[var(--text-on-gold)] font-bold text-sm mx-auto">
              F
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-1 flex-shrink-0 transition-colors" style={{ color: 'var(--text-muted)' }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium border-l-2
                  ${active
                    ? 'border-[var(--brand-gold)] text-[var(--brand-gold)] bg-white/5'
                    : 'border-transparent text-[var(--text-on-dark)] hover:text-[var(--brand-gold)] hover:bg-white/5'
                  }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-gold)] flex items-center justify-center text-[var(--text-on-gold)] font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-on-dark)' }}>{user?.name}</p>
                <p className="text-[10px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>{user?.itsNumber}</p>
              </div>
              <button onClick={logout} className="transition-colors" style={{ color: 'var(--text-muted)' }}>
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="w-full flex justify-center transition-colors" style={{ color: 'var(--text-muted)' }}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[var(--surface-sidebar)] flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="FMB Logo" width={90} height={36} className="object-contain md:hidden" />
            <h1 className="hidden md:block text-lg" style={{ fontFamily: 'Amiri, serif', color: 'var(--text-on-dark)' }}>
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-on-dark)' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content — pb-20 clears the mobile bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      {/* Fixed above all content, pointer-events always active */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch border-t"
        style={{
          background: 'var(--surface-sidebar)',
          borderColor: 'rgba(255,255,255,0.10)',
          zIndex: 9999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {mobileNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 touch-manipulation"
              style={{
                color: active ? 'var(--brand-gold)' : 'var(--text-muted)',
                minHeight: 56,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ transform: active ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
