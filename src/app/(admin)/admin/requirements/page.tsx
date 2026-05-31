'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetcher';
import { RotiRequirement, RequirementStatus } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL',       label: 'All Statuses' },
  { value: 'OPEN',      label: 'Open' },
  { value: 'CLOSED',    label: 'Closed' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminRequirementsPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => apiFetch<RotiRequirement[]>('/api/v1/requirements'),
  });

  const allRows = (data?.data || []) as (RotiRequirement & Record<string, unknown>)[];

  // Filter + sort: OPEN first, then by delivery date ascending (#2)
  const rows = useMemo(() => {
    const filtered = statusFilter === 'ALL' ? allRows : allRows.filter(r => r.status === statusFilter);
    return [...filtered].sort((a, b) => {
      // OPEN requirements first
      if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
      if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
      // Then ascending by delivery date
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });
  }, [allRows, statusFilter]);

  const columns = [
    {
      key: 'title', header: 'Title',
      cell: (r: RotiRequirement) => (
        <div>
          <Link href={`/admin/requirements/${r.id}`} className="font-medium hover:underline" style={{ color: 'var(--brand-brown)' }}>
            {r.title}
          </Link>
          {r.amountPerPacket && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              KD {parseFloat(r.amountPerPacket).toFixed(3)}/pkt
            </p>
          )}
        </div>
      )
    },
    {
      key: 'deliveryDate', header: 'Delivery Date',
      cell: (r: RotiRequirement) => {
        const isToday = r.deliveryDate === new Date().toISOString().split('T')[0];
        const isPast = new Date(r.deliveryDate) < new Date() && !isToday;
        return (
          <span className={isToday ? 'text-amber-600 font-semibold' : isPast ? 'text-red-500' : ''}>
            {format(new Date(r.deliveryDate), 'dd MMM yyyy')}
          </span>
        );
      }
    },
    { key: 'totalPacketsRequired', header: 'Required', cell: (r: RotiRequirement) => r.totalPacketsRequired },
    {
      key: 'totalCommitted', header: 'Committed',
      cell: (r: RotiRequirement) => {
        const pct = r.totalPacketsRequired > 0 ? Math.round(((r.totalCommitted || 0) / r.totalPacketsRequired) * 100) : 0;
        return (
          <div>
            <span className="font-semibold" style={{ color: 'var(--brand-gold-deep)' }}>{r.totalCommitted || 0}</span>
            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
          </div>
        );
      }
    },
    { key: 'status', header: 'Status', cell: (r: RotiRequirement) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '',
      cell: (r: RotiRequirement) => (
        <Link href={`/admin/requirements/${r.id}`}>
          <Button size="sm" variant="ghost" style={{ color: 'var(--brand-gold-deep)' }}>
            <Eye size={14} className="mr-1" /> View
          </Button>
        </Link>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          ROTI Requirements
        </h2>
        <Link href="/admin/requirements/new">
          <Button className="font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
            <Plus size={16} className="mr-1" /> New Requirement
          </Button>
        </Link>
      </div>

      {/* Status filter (#2) */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              statusFilter === opt.value
                ? 'border-[var(--brand-gold-deep)] bg-[var(--brand-gold)] text-[var(--text-on-gold)]'
                : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-gold-deep)]'
            }`}>
            {opt.label}
          </button>
        ))}
        <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
          {rows.length} shown · sorted by delivery date ↑
        </span>
      </div>

      <DataTable columns={columns as any} data={rows} searchKey="title" loading={isLoading} emptyMessage="No requirements found." />
    </div>
  );
}
