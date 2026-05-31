'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Payment, Commitment, RotiRequirement, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Download, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

type CommitmentRow = Commitment & { userName?: string; userItsNumber?: string; requirementTitle?: string; requirementDeliveryDate?: string };

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [addModal, setAddModal] = useState<CommitmentRow | null>(null);
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [form, setForm] = useState({ amountOwed: '', amountPaid: '', paymentMethod: 'CASH', paymentDate: new Date().toISOString().split('T')[0], notes: '' });

  const { data: paymentRes, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => apiFetch<Payment[]>('/api/v1/payments'),
  });

  const { data: commitRes } = useQuery({
    queryKey: ['all-commitments'],
    queryFn: () => apiFetch<CommitmentRow[]>('/api/v1/commitments'),
  });

  const payments = (paymentRes?.data || []) as (Payment & Record<string, unknown>)[];
  const received = (commitRes?.data || []).filter(c => c.status === 'RECEIVED' && !c.paymentExempt) as CommitmentRow[];

  async function recordPayment() {
    if (!addModal) return;
    const res = await apiFetch('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        commitmentId: addModal.id,
        amountOwed: form.amountOwed || undefined,
        amountPaid: form.amountPaid,
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate,
        notes: form.notes || undefined,
      }),
    });
    if (res.success) {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['payments'] });
      setAddModal(null);
      setForm({ amountOwed: '', amountPaid: '', paymentMethod: 'CASH', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
    } else toast.error(res.error || 'Failed');
  }

  async function downloadReport(fmt: 'csv' | 'pdf') {
    if (!reportFrom || !reportTo) { toast.error('Select date range first'); return; }
    if (fmt === 'csv') {
      const res = await fetch(`/api/v1/reports/payments?from=${reportFrom}&to=${reportTo}&format=csv`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { toast.error('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `payments-${reportFrom}-to-${reportTo}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      // PDF
      const res = await apiFetch<Payment[]>(`/api/v1/reports/payments?from=${reportFrom}&to=${reportTo}`);
      if (!res.success || !res.data) { toast.error('Failed to load data'); return; }
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14); doc.setTextColor(74,51,0);
      doc.text('FMB Salmiya — Payment Report', 14, 16);
      doc.setFontSize(10); doc.setTextColor(92,74,26);
      doc.text(`Period: ${reportFrom} to ${reportTo}   |   Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);

      const rows = res.data.map(r => {
        const owed = parseFloat(r.amountOwed || '0');
        const paid = parseFloat(r.amountPaid || '0');
        return [r.userItsNumber || '', r.userName || '', r.requirementTitle || '', r.committedQty || 0, r.deliveredQty ?? '—', owed.toFixed(3), paid.toFixed(3), (owed - paid).toFixed(3), r.paymentMethod || '', r.paymentDate || ''];
      });

      autoTable(doc, {
        startY: 30,
        head: [['ITS', 'Name', 'Requirement', 'Committed', 'Delivered', 'Owed (KD)', 'Paid (KD)', 'Balance (KD)', 'Method', 'Date']],
        body: rows,
        headStyles: { fillColor: [184,150,12], textColor: [44,31,0], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [255,253,240] },
      });
      doc.save(`payments-${reportFrom}-to-${reportTo}.pdf`);
    }
  }

  const columns = [
    { key: 'userItsNumber', header: 'ITS', cell: (r: Payment) => <span className="font-mono text-xs">{r.userItsNumber}</span> },
    { key: 'userName', header: 'Name', cell: (r: Payment) => <span className="font-medium">{r.userName}</span> },
    { key: 'requirementTitle', header: 'Requirement', cell: (r: Payment) => <span className="text-xs">{r.requirementTitle}</span> },
    { key: 'deliveredQty', header: 'Delivered', cell: (r: Payment) => r.deliveredQty ?? '—' },
    { key: 'amountOwed', header: 'Owed (KD)', cell: (r: Payment) => r.amountOwed ? parseFloat(r.amountOwed).toFixed(3) : '—' },
    { key: 'amountPaid', header: 'Paid (KD)', cell: (r: Payment) => <span className="text-green-700 font-semibold">{parseFloat(r.amountPaid).toFixed(3)}</span> },
    { key: 'balance', header: 'Balance', cell: (r: Payment) => {
      const b = parseFloat(r.amountOwed || '0') - parseFloat(r.amountPaid || '0');
      return <span className={b > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{b.toFixed(3)}</span>;
    }},
    { key: 'paymentMethod', header: 'Method', cell: (r: Payment) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{r.paymentMethod}</span> },
    { key: 'paymentDate', header: 'Date', cell: (r: Payment) => r.paymentDate },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
        Payment Tracking
      </h2>

      {/* Commitments awaiting payment */}
      {received.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            Received — Awaiting Payment ({received.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {received.map(c => (
              <div key={c.id} className="bg-white border rounded-xl p-4" style={{ borderColor: 'var(--border-default)', borderLeft: '4px solid var(--brand-gold)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{c.userName}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.userItsNumber}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{(c as any).requirementTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Committed: {c.packetsCommitted} · Delivered: {c.actualDeliveredQty ?? '?'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAddModal(c)} className="text-xs h-7" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                    <Plus size={11} className="mr-1" /> Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Payment History</h3>
        <DataTable columns={columns as any} data={payments} searchKey="userName" loading={isLoading} />
      </div>

      {/* Date range report */}
      <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Date Range Report</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: 'var(--text-secondary)' }}>From</Label>
            <Input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="border-[var(--border-default)] w-auto" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" style={{ color: 'var(--text-secondary)' }}>To</Label>
            <Input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="border-[var(--border-default)] w-auto" />
          </div>
          <Button onClick={() => downloadReport('csv')} variant="outline" className="border-[var(--border-default)] text-[var(--brand-brown)]">
            <Download size={14} className="mr-1" /> CSV
          </Button>
          <Button onClick={() => downloadReport('pdf')} style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
            <FileText size={14} className="mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Record payment modal */}
      <Dialog open={!!addModal} onOpenChange={() => setAddModal(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Record Payment</DialogTitle>
          </DialogHeader>
          {addModal && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[var(--brand-cream)] rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong>{addModal.userName}</strong> ({addModal.userItsNumber})<br />
                {(addModal as any).requirementTitle} · Delivered: {addModal.actualDeliveredQty ?? addModal.packetsCommitted} pkts
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount Owed (KD)</Label>
                  <Input type="number" step="0.001" placeholder="0.000" value={form.amountOwed} onChange={e => setForm(f => ({ ...f, amountOwed: e.target.value }))} className="border-[var(--border-default)]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount Paid (KD) *</Label>
                  <Input type="number" step="0.001" placeholder="0.000" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} className="border-[var(--border-default)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Method *</Label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment Date *</Label>
                  <Input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} className="border-[var(--border-default)]" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="border-[var(--border-default)]" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAddModal(null)}>Cancel</Button>
                <Button onClick={recordPayment} disabled={!form.amountPaid} style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
