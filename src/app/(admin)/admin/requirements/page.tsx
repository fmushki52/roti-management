'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { RotiRequirement } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminRequirementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => apiFetch<RotiRequirement[]>('/api/v1/requirements'),
  });

  const rows = (data?.data || []) as (RotiRequirement & Record<string, unknown>)[];

  const columns = [
    { key: 'title', header: 'Title', cell: (r: RotiRequirement) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</span> },
    { key: 'deliveryDate', header: 'Delivery Date', cell: (r: RotiRequirement) => format(new Date(r.deliveryDate), 'dd MMM yyyy') },
    { key: 'totalPacketsRequired', header: 'Required', cell: (r: RotiRequirement) => r.totalPacketsRequired },
    { key: 'totalCommitted', header: 'Committed', cell: (r: RotiRequirement) => <span className="font-semibold" style={{ color: 'var(--brand-gold-deep)' }}>{r.totalCommitted || 0}</span> },
    { key: 'status', header: 'Status', cell: (r: RotiRequirement) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: 'Actions',
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          ROTI Requirements
        </h2>
        <Link href="/admin/requirements/new">
          <Button className="font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
            <Plus size={16} className="mr-1" /> New Requirement
          </Button>
        </Link>
      </div>
      <DataTable columns={columns as any} data={rows} searchKey="title" loading={isLoading} emptyMessage="No requirements yet." />
    </div>
  );
}
