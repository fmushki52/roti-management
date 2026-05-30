'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Commitment } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DeliveryFeedbackModal } from '@/components/admin/DeliveryFeedbackModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function AdminDeliveriesPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [feedbackTarget, setFeedbackTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['commitments'],
    queryFn: () => apiFetch<(Commitment & { userName?: string; requirementTitle?: string; requirementDeliveryDate?: string })[]>('/api/v1/commitments'),
  });

  const all = data?.data || [];
  const filtered = all.filter(c =>
    (!dateFilter || (c as any).requirementDeliveryDate === dateFilter)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Deliveries
        </h2>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto border-[var(--border-default)]" />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-cream)] border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Mumineen</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Requirement</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Packets</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">No deliveries for this date</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)] transition-colors" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-4 py-3 font-medium">{(c as any).userName || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{(c as any).requirementTitle || '—'}</td>
                  <td className="px-4 py-3">{c.packetsCommitted}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {c.status === 'DONE' && (
                      <Button size="sm" onClick={() => setFeedbackTarget({ id: c.id, name: (c as any).userName || '' })}
                        className="font-semibold text-xs" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                        Mark Received
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeliveryFeedbackModal
        commitmentId={feedbackTarget?.id || null}
        userName={feedbackTarget?.name || ''}
        onClose={() => setFeedbackTarget(null)}
        onSuccess={() => { setFeedbackTarget(null); qc.invalidateQueries({ queryKey: ['commitments'] }); }}
      />
    </div>
  );
}
