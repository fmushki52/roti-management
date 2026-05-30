import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

export const metadata: Metadata = {
  title: 'ROTI Management — FMB Salmiya',
  description: 'Faiz al-Mawaid al-Burhaniyah — Badri Mohallah Salmiya',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Nunito, sans-serif' }}>
        <Providers>
          <OfflineBanner />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
