'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Commitment } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

type Row = Commitment & { userName?: string; userItsNumber?: string; requirementTitle?: string; requirementDeliveryDate?: string };

export default function AdminApprovalsPage() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reverseTarget, setReverseTarget] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['all-commitments'],
    queryFn: () => apiFetch<Row[]>('/api/v1/commitments'),
  });

  const all = (data?.data || []) as Row[];
  const pending = all.filter(c => c.status === 'PENDING');

  async function approve(id: string, paymentExempt = false) {
    const res = await apiFetch(`/api/v1/commitments/${id}/approve`, {
      method: 'PATCH', body: JSON.stringify({ paymentExempt }),
    });
    if (res.success) { toast.success('Approved & Mumineen notified'); qc.invalidateQueries({ queryKey: ['all-commitments'] }); }
    else toast.error(res.error || 'Failed');
  }

  async function approveSelected() {
    for (const id of selected) await approve(id);
    setSelected(new Set());
  }

  async function reject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    const res = await apiFetch(`/api/v1/commitments/${rejectTarget}/reject`, {
      method: 'PATCH', body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.success) {
      toast.success('Rejected');
      qc.invalidateQueries({ queryKey: ['all-commitments'] });
      setRejectTarget(null); setRejectReason('');
    } else toast.error(res.error || 'Failed');
  }

  async function reverseApproval() {
    if (!reverseTarget || !reverseReason.trim()) return;
    const res = await apiFetch(`/api/v1/commitments/${reverseTarget}/reverse-approval`, {
      method: 'PATCH', body: JSON.stringify({ reason: reverseReason }),
    });
    if (res.success) {
      toast.success('Approval reversed & Mumineen notified');
      qc.invalidateQueries({ queryKey: ['all-commitments'] });
      setReverseTarget(null); setReverseReason('');
    } else toast.error(res.error || 'Failed');
  }

  if (isLoading) return <div className="animate-pulse h-64 bg-[var(--brand-gold-light)] rounded-xl" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Pending Approvals ({pending.length})
        </h2>
        {selected.size > 0 && (
          <Button onClick={approveSelected} className="bg-green-500 text-white hover:bg-green-600">
            <CheckCircle size={14} className="mr-1" /> Approve Selected ({selected.size})
          </Button>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-lg" style={{ fontFamily: 'Amiri, serif', color: 'var(--text-muted)' }}>No pending approvals</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-[var(--brand-cream)] border-b" style={{ borderColor: 'var(--border-default)' }}>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelected(new Set(pending.map(c => c.id)));
                    else setSelected(new Set());
                  }} />
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>ITS / Name</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Requirement</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Packets</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Submitted</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(c => (
                <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)] transition-colors" style={{ borderColor: 'var(--border-default)' }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={e => {
                      const s = new Set(selected);
                      e.target.checked ? s.add(c.id) : s.delete(c.id);
                      setSelected(s);
                    }} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.userName}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.userItsNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ color: 'var(--text-secondary)' }}>{(c as any).requirementTitle || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(c as any).requirementDeliveryDate}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--brand-gold-deep)' }}>{c.packetsCommitted}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => approve(c.id)} className="bg-green-500 text-white hover:bg-green-600 text-xs h-7">
                        <CheckCircle size={12} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" onClick={() => approve(c.id, true)} variant="outline" className="text-xs h-7 border-green-300 text-green-700">
                        Exempt ✓
                      </Button>
                      <Button size="sm" onClick={() => setRejectTarget(c.id)} className="bg-red-500 text-white hover:bg-red-600 text-xs h-7">
                        <XCircle size={12} className="mr-1" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent approved — can reverse */}
      {(() => {
        const reversible = all.filter(c => ['APPROVED', 'PREPARING'].includes(c.status));
        if (reversible.length === 0) return null;
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
              Recently Approved (can reverse)
            </h3>
            <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
              <table className="w-full text-sm min-w-[600px]">
                <tbody>
                  {reversible.slice(0, 20).map(c => (
                    <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)]" style={{ borderColor: 'var(--border-default)' }}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.userName} <span className="font-mono text-xs text-[var(--text-muted)]">({c.userItsNumber})</span></p>
                        <p className="text-xs text-[var(--text-muted)]">{(c as any).requirementTitle} · {c.packetsCommitted} pkts</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setReverseTarget(c.id)}
                          className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50 h-7">
                          <RotateCcw size={11} className="mr-1" /> Reverse
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Reject modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Reject Commitment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="border-[var(--border-default)]" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button onClick={reject} className="bg-red-500 text-white hover:bg-red-600">Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reverse approval modal */}
      <Dialog open={!!reverseTarget} onOpenChange={() => setReverseTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Reverse Approval</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This will reject the commitment and notify the Mumineen. A reason is required.
            </p>
            <Textarea placeholder="Reason for reversing approval…" value={reverseReason} onChange={e => setReverseReason(e.target.value)} rows={3} className="border-[var(--border-default)]" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setReverseTarget(null)}>Cancel</Button>
              <Button onClick={reverseApproval} disabled={!reverseReason.trim()} className="bg-orange-500 text-white hover:bg-orange-600">Reverse Approval</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
