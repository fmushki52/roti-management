'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Commitment } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/shared/RatingStars';
import { toast } from 'sonner';
import { PackageCheck, Clock, Star } from 'lucide-react';

type Row = Commitment & {
  userName?: string;
  userItsNumber?: string;
  requirementTitle?: string;
  requirementDeliveryDate?: string;
};

export default function AdminDeliveriesPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);

  // Rating modal — admin only action AFTER delivery team confirms
  const [ratingTarget, setRatingTarget] = useState<Row | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['commitments'],
    queryFn: () => apiFetch<Row[]>('/api/v1/commitments'),
  });

  const all = data?.data || [];
  const filtered = all.filter(c =>
    !dateFilter || (c as any).requirementDeliveryDate === dateFilter
  );

  // Split into pending delivery (DONE — waiting for delivery team) and received
  const waitingDelivery = filtered.filter(c => c.status === 'DONE');
  const received = filtered.filter(c => c.status === 'RECEIVED');

  async function saveRating() {
    if (!ratingTarget) return;
    setLoading(true);
    const res = await apiFetch(`/api/v1/commitments/${ratingTarget.id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
    setLoading(false);
    if (res.success) {
      toast.success('Rating saved');
      qc.invalidateQueries({ queryKey: ['commitments'] });
      setRatingTarget(null); setRating(5); setFeedback('');
    } else toast.error(res.error || 'Failed');
  }

  function TableRows({ rows, showAction }: { rows: Row[]; showAction: boolean }) {
    if (rows.length === 0) return (
      <tr><td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        No entries
      </td></tr>
    );
    return (
      <>
        {rows.map(c => (
          <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)] transition-colors" style={{ borderColor: 'var(--border-default)' }}>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.userName}</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.userItsNumber}</p>
            </td>
            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{(c as any).requirementTitle}</td>
            <td className="px-4 py-3 font-semibold text-center">{c.packetsCommitted}</td>
            <td className="px-4 py-3 text-center">
              {c.actualDeliveredQty != null ? (
                <span className={`font-semibold ${c.actualDeliveredQty < c.packetsCommitted ? 'text-amber-600' : 'text-green-600'}`}>
                  {c.actualDeliveredQty}
                  {c.actualDeliveredQty < c.packetsCommitted && (
                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>
                      ({c.packetsCommitted - c.actualDeliveredQty} short)
                    </span>
                  )}
                </span>
              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
            </td>
            <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
            <td className="px-4 py-3">
              {showAction && c.status === 'RECEIVED' && !c.adminRating && (
                <Button size="sm" onClick={() => { setRatingTarget(c); setRating(5); setFeedback(''); }}
                  className="text-xs h-7" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                  <Star size={12} className="mr-1" /> Rate & Review
                </Button>
              )}
              {showAction && c.status === 'RECEIVED' && c.adminRating && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < (c.adminRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
              )}
              {!showAction && (
                <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  Awaiting delivery team
                </span>
              )}
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Deliveries
        </h2>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto border-[var(--border-default)]" />
      </div>

      {/* Section 1 — Waiting for Delivery Team */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: 'var(--status-pending)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            Waiting for Delivery Team Confirmation ({waitingDelivery.length})
          </h3>
        </div>
        <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-amber-50 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Mumineen</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Requirement</th>
                <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Committed</th>
                <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Delivered</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={6} className="px-4 py-8 text-center">Loading…</td></tr>
                : <TableRows rows={waitingDelivery} showAction={false} />
              }
            </tbody>
          </table>
        </div>
        {waitingDelivery.length > 0 && (
          <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            ℹ Delivery team must confirm receipt before admin can rate or process payment.
          </p>
        )}
      </div>

      {/* Section 2 — Received by Delivery Team — Admin can rate */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PackageCheck size={16} className="text-green-600" />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            Received — Awaiting Admin Rating ({received.length})
          </h3>
        </div>
        <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-green-50 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Mumineen</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Requirement</th>
                <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Committed</th>
                <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Delivered</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={6} className="px-4 py-8 text-center">Loading…</td></tr>
                : <TableRows rows={received} showAction={true} />
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating modal */}
      <Dialog open={!!ratingTarget} onOpenChange={() => setRatingTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
              Rate Delivery — {ratingTarget?.userName}
            </DialogTitle>
          </DialogHeader>
          {ratingTarget && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[var(--brand-cream)] rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{ratingTarget.requirementTitle}</strong>
                <span className="ml-2">· Delivered: <strong>{ratingTarget.actualDeliveredQty ?? ratingTarget.packetsCommitted} pkts</strong></span>
                {ratingTarget.actualDeliveredQty != null && ratingTarget.actualDeliveredQty < ratingTarget.packetsCommitted && (
                  <span className="ml-2 text-amber-600">({ratingTarget.packetsCommitted - ratingTarget.actualDeliveredQty} short)</span>
                )}
              </div>
              <div className="space-y-1">
                <Label>Rating (1–5 stars)</Label>
                <RatingStars rating={rating} onChange={setRating} size={32} />
              </div>
              <div className="space-y-1">
                <Label>Feedback (optional)</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                  placeholder="Quality, punctuality, notes for admin records…"
                  className="border-[var(--border-default)]" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setRatingTarget(null)}>Cancel</Button>
                <Button disabled={loading} onClick={saveRating}
                  style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                  {loading ? 'Saving…' : 'Save Rating'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
