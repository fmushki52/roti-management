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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PackageCheck, Truck } from 'lucide-react';

type Row = Commitment & { userName?: string; userItsNumber?: string; requirementTitle?: string; requirementDeliveryDate?: string };

export default function DeliveryDeliveriesPage() {
  const qc = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null);
  const [qty, setQty] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['all-commitments'],
    queryFn: () => apiFetch<Row[]>('/api/v1/commitments'),
  });

  const all = data?.data || [];
  const doneRows = all.filter(c => c.status === 'DONE' && (!dateFilter || (c as any).requirementDeliveryDate === dateFilter));

  async function confirmDelivery() {
    if (!confirmTarget) return;
    setLoading(true);
    const res = await apiFetch(`/api/v1/commitments/${confirmTarget.id}/delivery-confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ actualDeliveredQty: qty, notes: notes || undefined }),
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Delivery confirmed — ${qty} packets received`);
      qc.invalidateQueries({ queryKey: ['all-commitments'] });
      setConfirmTarget(null); setQty(0); setNotes('');
    } else toast.error(res.error || 'Failed');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
          Confirm Deliveries
        </h2>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto border-[var(--border-default)]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 bg-[var(--brand-gold-light)] animate-pulse rounded-xl"/>)}</div>
      ) : doneRows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <Truck size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg" style={{ fontFamily: 'Amiri, serif', color: 'var(--text-muted)' }}>No deliveries ready for this date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doneRows.map(c => (
            <div key={c.id} className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4"
              style={{ borderColor: 'var(--border-default)', borderLeft: '4px solid var(--brand-gold)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.userName}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.userItsNumber}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {(c as any).requirementTitle} · <strong>{c.packetsCommitted} packets committed</strong>
                </p>
              </div>
              <Button onClick={() => { setConfirmTarget(c); setQty(c.packetsCommitted); }}
                className="flex-shrink-0 font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                <PackageCheck size={16} className="mr-2" /> Confirm Receipt
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Confirm Delivery Receipt</DialogTitle>
          </DialogHeader>
          {confirmTarget && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[var(--brand-cream)] rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{confirmTarget.userName}</strong> committed <strong>{confirmTarget.packetsCommitted} packets</strong>
              </div>
              <div className="space-y-1">
                <Label>Actual packets received *</Label>
                <Input type="number" min={0} max={confirmTarget.packetsCommitted} value={qty}
                  onChange={e => setQty(Number(e.target.value))}
                  className="border-[var(--border-default)] text-lg text-center font-bold" />
                {qty < confirmTarget.packetsCommitted && qty > 0 && (
                  <p className="text-amber-600 text-xs">⚠ Partial delivery — {confirmTarget.packetsCommitted - qty} packets short</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="border-[var(--border-default)]" placeholder="Any notes about the delivery…" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setConfirmTarget(null)}>Cancel</Button>
                <Button disabled={loading || qty < 0} onClick={confirmDelivery}
                  style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                  {loading ? 'Confirming…' : `Confirm ${qty} Packets Received`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
