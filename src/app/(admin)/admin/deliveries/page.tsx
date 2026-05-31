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

type Row = Commitment & { userName?: string; userItsNumber?: string; requirementTitle?: string; requirementDeliveryDate?: string };

export default function AdminDeliveriesPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);

  // Delivery confirm modal
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null);
  const [qty, setQty] = useState(0);
  const [confirmNotes, setConfirmNotes] = useState('');

  // Rating modal (for RECEIVED items)
  const [ratingTarget, setRatingTarget] = useState<Row | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['commitments'],
    queryFn: () => apiFetch<Row[]>('/api/v1/commitments'),
  });

  const all = data?.data || [];
  const filtered = all.filter(c => !dateFilter || (c as any).requirementDeliveryDate === dateFilter);

  async function confirmDelivery() {
    if (!confirmTarget) return;
    setLoading(true);
    const res = await apiFetch(`/api/v1/commitments/${confirmTarget.id}/delivery-confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ actualDeliveredQty: qty, notes: confirmNotes || undefined }),
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Delivery confirmed — ${qty} packets received`);
      qc.invalidateQueries({ queryKey: ['commitments'] });
      setConfirmTarget(null); setQty(0); setConfirmNotes('');
    } else toast.error(res.error || 'Failed');
  }

  async function saveRating() {
    if (!ratingTarget) return;
    setLoading(true);
    await apiFetch(`/api/v1/commitments/${ratingTarget.id}/feedback`, {
      method: 'POST', body: JSON.stringify({ rating, feedback }),
    });
    setLoading(false);
    toast.success('Rating saved');
    qc.invalidateQueries({ queryKey: ['commitments'] });
    setRatingTarget(null); setRating(5); setFeedback('');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Deliveries
        </h2>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto border-[var(--border-default)]" />
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[var(--brand-cream)] border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Mumineen</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Requirement</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Committed</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Delivered</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No deliveries for this date</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)] transition-colors" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.userName}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.userItsNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{(c as any).requirementTitle}</td>
                  <td className="px-4 py-3 font-semibold">{c.packetsCommitted}</td>
                  <td className="px-4 py-3">
                    {c.actualDeliveredQty != null ? (
                      <span className={c.actualDeliveredQty < c.packetsCommitted ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {c.actualDeliveredQty}
                        {c.actualDeliveredQty < c.packetsCommitted && (
                          <span className="text-xs ml-1">({c.packetsCommitted - c.actualDeliveredQty} short)</span>
                        )}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    {c.status === 'DONE' && (
                      <Button size="sm" onClick={() => { setConfirmTarget(c); setQty(c.packetsCommitted); }}
                        className="font-semibold text-xs h-7" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                        Confirm Receipt
                      </Button>
                    )}
                    {c.status === 'RECEIVED' && !c.adminRating && (
                      <Button size="sm" variant="outline" onClick={() => setRatingTarget(c)}
                        className="text-xs h-7 border-[var(--border-default)] text-[var(--brand-brown)]">
                        ★ Rate
                      </Button>
                    )}
                    {c.status === 'RECEIVED' && c.adminRating && (
                      <span className="text-xs text-amber-500">{'★'.repeat(c.adminRating)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm delivery modal */}
      <Dialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Confirm Delivery</DialogTitle>
          </DialogHeader>
          {confirmTarget && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[var(--brand-cream)] rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{confirmTarget.userName}</strong> committed <strong>{confirmTarget.packetsCommitted} packets</strong>
              </div>
              <div className="space-y-1">
                <Label>Actual packets received *</Label>
                <Input type="number" min={0} max={confirmTarget.packetsCommitted + 5} value={qty}
                  onChange={e => setQty(Number(e.target.value))}
                  className="border-[var(--border-default)] text-xl text-center font-bold h-14" />
                {qty < confirmTarget.packetsCommitted && qty >= 0 && (
                  <p className="text-amber-600 text-xs">⚠ Partial — {confirmTarget.packetsCommitted - qty} packet(s) short</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea value={confirmNotes} onChange={e => setConfirmNotes(e.target.value)} rows={2} className="border-[var(--border-default)]" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setConfirmTarget(null)}>Cancel</Button>
                <Button disabled={loading} onClick={confirmDelivery} style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                  {loading ? 'Saving…' : `Confirm ${qty} Packets`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating modal */}
      <Dialog open={!!ratingTarget} onOpenChange={() => setRatingTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
              Rate — {ratingTarget?.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Rating</Label>
              <RatingStars rating={rating} onChange={setRating} size={28} />
            </div>
            <div className="space-y-1">
              <Label>Feedback (optional)</Label>
              <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="border-[var(--border-default)]" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setRatingTarget(null)}>Cancel</Button>
              <Button disabled={loading} onClick={saveRating} style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                {loading ? 'Saving…' : 'Save Rating'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
