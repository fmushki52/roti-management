'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import Image from 'next/image';
import {
  LayoutDashboard, ListChecks, Users, Truck, Bell, BarChart2,
  ChevronLeft, ChevronRight, LogOut, Menu,
} from 'lucide-react';

interface NavItem { label: string; href: string; icon: React.ReactNode; }

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/admin/dashboard',      icon: <LayoutDashboard size={18} /> },
  { label: 'Requirements',  href: '/admin/requirements',   icon: <ListChecks size={18} /> },
  { label: 'Mumineen',      href: '/admin/users',          icon: <Users size={18} /> },
  { label: 'Deliveries',    href: '/admin/deliveries',     icon: <Truck size={18} /> },
  { label: 'Notifications', href: '/admin/notifications',  icon: <Bell size={18} /> },
  { label: 'Reports',       href: '/admin/reports',        icon: <BarChart2 size={18} /> },
];

const MUMINEEN_NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/mumineen/dashboard',       icon: <LayoutDashboard size={18} /> },
  { label: 'Requirements',    href: '/mumineen/requirements',    icon: <ListChecks size={18} /> },
  { label: 'My Commitments',  href: '/mumineen/my-commitments',  icon: <ListChecks size={18} /> },
  { label: 'Notifications',   href: '/mumineen/notifications',   icon: <Bell size={18} /> },
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

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-page)]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[var(--surface-sidebar)] transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 hidden md:flex`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
          {!collapsed && (
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <Image src="/logo.png" alt="FMB Logo" width={160} height={64} className="object-contain" style={{ maxHeight: 52 }} />
              <p className="text-[var(--text-muted)] text-[10px] leading-tight pl-0.5">ROTI Management</p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-[var(--brand-gold)] flex items-center justify-center text-[var(--text-on-gold)] font-bold text-sm mx-auto">
              F
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-[var(--text-muted)] hover:text-[var(--brand-gold)] transition-colors ml-1 flex-shrink-0">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                  ${active
                    ? 'border-l-2 border-[var(--brand-gold)] text-[var(--brand-gold)] bg-white/5'
                    : 'text-[var(--text-on-dark)] hover:text-[var(--brand-gold)] hover:bg-white/5 border-l-2 border-transparent'
                  }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-gold)] flex items-center justify-center text-[var(--text-on-gold)] font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-on-dark)] text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-[var(--text-muted)] text-[10px] truncate">{user?.role}</p>
              </div>
              <button onClick={logout} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={logout} className="w-full flex justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[var(--surface-sidebar)] flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-[var(--text-on-dark)] font-display text-lg" style={{ fontFamily: 'Amiri, serif' }}>{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
