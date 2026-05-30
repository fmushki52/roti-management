'use client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="slide-down w-full bg-amber-100 border-b border-amber-400 px-4 py-2 text-center text-amber-900 font-medium text-sm z-50">
      ⚠ You are currently offline. Please check your internet connection.
    </div>
  );
}
