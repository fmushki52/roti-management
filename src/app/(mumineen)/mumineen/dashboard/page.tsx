'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Commitment, RotiRequirement } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Package, Calendar, ArrowRight } from 'lucide-react';

export default function MumineenDashboardPage() {
  const { user } = useAuthStore();
  const { data: commitRes } = useQuery({
    queryKey: ['my-commitments'],
    queryFn: () => apiFetch<(Commitment & { requirementTitle?: string; requirementDeliveryDate?: string })[]>('/api/v1/commitments'),
  });
  const { data: reqRes } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => apiFetch<RotiRequirement[]>('/api/v1/requirements'),
  });

  const myCommitments = commitRes?.data || [];
  const openReqs = reqRes?.data || [];
  const upcoming = myCommitments.filter(c => ['APPROVED', 'PREPARING', 'DONE'].includes(c.status));
  const totalPackets = myCommitments.reduce((s, c) => s + c.packetsCommitted, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
          Salaamun Alaikum, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here's your ROTI contribution summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Commitments', value: myCommitments.length, color: 'var(--brand-gold)' },
          { label: 'Total Packets', value: totalPackets, color: 'var(--brand-gold-deep)' },
          { label: 'Active / Upcoming', value: upcoming.length, color: 'var(--status-preparing)' },
          { label: 'Open Requirements', value: openReqs.length, color: 'var(--status-approved)' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border p-4" style={{ borderColor: 'var(--border-default)', borderLeft: `4px solid ${kpi.color}` }}>
            <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'Amiri, serif' }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Recent commitments */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>My Commitments</h3>
          <Link href="/mumineen/my-commitments">
            <Button size="sm" variant="ghost" style={{ color: 'var(--brand-gold-deep)' }}>
              View all <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {myCommitments.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{(c as any).requirementTitle || 'Requirement'}</p>
                <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Package size={11} /> {c.packetsCommitted} packets</span>
                  {(c as any).requirementDeliveryDate && (
                    <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date((c as any).requirementDeliveryDate), 'dd MMM yyyy')}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {myCommitments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No commitments yet.</p>
              <Link href="/mumineen/requirements">
                <Button size="sm" className="mt-2" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>Browse Requirements</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
