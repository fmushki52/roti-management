'use client';
import { useState, use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { RotiRequirement, Commitment } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface RequirementDetail extends RotiRequirement {
  commitments: (Commitment & { userName?: string; userEmail?: string })[];
}

export default function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['requirement', id],
    queryFn: () => apiFetch<RequirementDetail>(`/api/v1/requirements/${id}`),
  });

  const req = data?.data;
  const commits = req?.commitments || [];
  const totalApproved = commits.filter(c => !['PENDING', 'REJECTED'].includes(c.status)).reduce((s, c) => s + c.packetsCommitted, 0);
  const overCommitted = req && totalApproved > req.totalPacketsRequired;

  async function approve(commitId: string) {
    const res = await apiFetch(`/api/v1/commitments/${commitId}/approve`, { method: 'PATCH' });
    if (res.success) { toast.success('Approved'); qc.invalidateQueries({ queryKey: ['requirement', id] }); }
    else toast.error(res.error || 'Failed');
  }

  async function approveSelected() {
    for (const cid of selected) await approve(cid);
    setSelected(new Set());
  }

  async function updateRequirementStatus(status: 'CLOSED' | 'CANCELLED' | 'OPEN') {
    const res = await apiFetch(`/api/v1/requirements/${id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
    if (res.success) {
      toast.success(`Requirement ${status.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ['requirement', id] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
    } else toast.error(res.error || 'Failed');
  }

  async function reject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    const res = await apiFetch(`/api/v1/commitments/${rejectTarget}/reject`, {
      method: 'PATCH', body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.success) {
      toast.success('Rejected');
      qc.invalidateQueries({ queryKey: ['requirement', id] });
      setRejectTarget(null); setRejectReason('');
    } else toast.error(res.error || 'Failed');
  }

  if (isLoading) return <div className="animate-pulse h-64 bg-[var(--brand-gold-light)] rounded-xl" />;
  if (!req) return <div>Not found</div>;

  const pct = Math.min(((req.totalCommitted || 0) / req.totalPacketsRequired) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
            {req.title}
          </h2>
          {/* Issue #3: Close / Cancel / Re-open buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {req.status === 'OPEN' && (
              <>
                <Button size="sm" variant="outline" onClick={() => updateRequirementStatus('CLOSED')}
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  Close
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateRequirementStatus('CANCELLED')}
                  className="border-red-300 text-red-600 hover:bg-red-50">
                  Cancel
                </Button>
              </>
            )}
            {(req.status === 'CLOSED' || req.status === 'CANCELLED') && (
              <Button size="sm" onClick={() => updateRequirementStatus('OPEN')}
                style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                Re-open
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-sm flex-wrap" style={{ color: 'var(--text-secondary)' }}>
          <span>Delivery: <strong>{format(new Date(req.deliveryDate), 'dd MMM yyyy')}</strong></span>
          <span>Required: <strong>{req.totalPacketsRequired}</strong></span>
          {req.minPacketsPerCommit && <span>Min/commit: <strong>{req.minPacketsPerCommit}</strong></span>}
          {req.maxPacketsPerCommit && <span>Max/commit: <strong>{req.maxPacketsPerCommit}</strong></span>}
          <span>Committed: <strong style={{ color: 'var(--brand-gold-deep)' }}>{req.totalCommitted || 0}</strong></span>
          <StatusBadge status={req.status} />
        </div>
        {/* Progress */}
        <div className="mt-3 h-3 bg-[var(--brand-gold-light)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--brand-gold)] rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Over-committed warning */}
      {overCommitted && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm">
          <AlertTriangle size={16} />
          ⚠ Commitments exceed target. Review before approving more.
        </div>
      )}

      {/* Bulk approve */}
      {selected.size > 0 && (
        <Button size="sm" onClick={approveSelected} className="bg-green-500 text-white hover:bg-green-600">
          Approve Selected ({selected.size})
        </Button>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-cream)] border-b" style={{ borderColor: 'var(--border-default)' }}>
              <th className="px-4 py-3 text-left w-8">
                <input type="checkbox" onChange={e => {
                  if (e.target.checked) setSelected(new Set(commits.filter(c => c.status === 'PENDING').map(c => c.id)));
                  else setSelected(new Set());
                }} />
              </th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Mumineen</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Packets</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Submitted</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commits.map(c => (
              <tr key={c.id} className="border-b hover:bg-[var(--brand-cream)] transition-colors" style={{ borderColor: 'var(--border-default)' }}>
                <td className="px-4 py-3">
                  {c.status === 'PENDING' && (
                    <input type="checkbox" checked={selected.has(c.id)}
                      onChange={e => {
                        const s = new Set(selected);
                        e.target.checked ? s.add(c.id) : s.delete(c.id);
                        setSelected(s);
                      }}
                    />
                  )}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{c.userName}</td>
                <td className="px-4 py-3">{c.packetsCommitted}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  {c.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(c.id)} className="bg-green-500 text-white hover:bg-green-600 text-xs py-1 h-auto">Approve</Button>
                      <Button size="sm" onClick={() => setRejectTarget(c.id)} className="bg-red-500 text-white hover:bg-red-600 text-xs py-1 h-auto">Reject</Button>
                    </div>
                  )}
                  {c.rejectionReason && (
                    <span className="text-xs text-red-500">{c.rejectionReason}</span>
                  )}
                </td>
              </tr>
            ))}
            {commits.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No commitments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Reject Commitment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="border-[var(--border-default)]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button onClick={reject} className="bg-red-500 text-white hover:bg-red-600">Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
