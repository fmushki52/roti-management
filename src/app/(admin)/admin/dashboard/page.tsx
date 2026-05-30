'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { RotiRequirement, Commitment } from '@/types';
import { ProgressDonut } from '@/components/shared/ProgressDonut';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Send } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: reqRes } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => apiFetch<RotiRequirement[]>('/api/v1/requirements'),
  });
  const { data: commitRes } = useQuery({
    queryKey: ['commitments'],
    queryFn: () => apiFetch<Commitment[]>('/api/v1/commitments'),
  });

  const requirements = reqRes?.data || [];
  const allCommitments = commitRes?.data || [];

  const openReqs = requirements.filter(r => r.status === 'OPEN');
  const nextReq = openReqs.sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())[0];
  const pendingApprovals = allCommitments.filter(c => c.status === 'PENDING').length;
  const today = new Date().toISOString().split('T')[0];
  const todayDeliveries = allCommitments.filter(c => {
    const req = requirements.find(r => r.id === (c as any).requirementId);
    return (req?.deliveryDate === today) && (c.status === 'DONE' || c.status === 'DELIVERED');
  }).length;

  // Unique users
  const uniqueUsers = new Set(allCommitments.map(c => c.userId)).size;

  // Chart data — commitments for next requirement
  const nextReqCommits = nextReq
    ? allCommitments.filter(c => (c as any).requirementId === nextReq.id)
    : [];
  const chartData = nextReqCommits.map(c => ({
    name: (c as any).userName || 'Unknown',
    packets: c.packetsCommitted,
  }));

  // Recent activity
  const recentActivity = [...allCommitments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Hero donut */}
      {nextReq && (
        <div className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row items-center gap-6" style={{ borderColor: 'var(--border-default)', boxShadow: '0 2px 12px rgba(184,150,12,0.10)' }}>
          <ProgressDonut target={nextReq.totalPacketsRequired} committed={nextReq.totalCommitted || 0} size={180} />
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>{nextReq.title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Delivery: {format(new Date(nextReq.deliveryDate), 'dd MMM yyyy')}</p>
            <p className="text-2xl font-bold mt-2" style={{ color: 'var(--brand-gold-deep)' }}>
              {nextReq.totalCommitted || 0} / {nextReq.totalPacketsRequired} packets committed
            </p>
            <StatusBadge status={nextReq.status} size="md" />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Requirements', value: openReqs.length, color: 'var(--brand-gold)' },
          { label: 'Pending Approvals', value: pendingApprovals, color: 'var(--status-pending)' },
          { label: 'Deliveries Today', value: todayDeliveries, color: 'var(--status-done)' },
          { label: 'Total Mumineen', value: uniqueUsers, color: 'var(--status-approved)' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)', borderLeft: `4px solid ${kpi.color}` }}>
            <p className="text-3xl font-bold" style={{ color: kpi.color, fontFamily: 'Amiri, serif' }}>{kpi.value}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)' }}>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
              Commitments by Mumineen
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="packets" fill="#FFD700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: 'var(--border-default)' }}>
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Recent Activity</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {recentActivity.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(c as any).userName || 'User'}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(c.updatedAt), 'dd MMM HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/admin/requirements/new">
          <Button className="font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
            <Plus size={16} className="mr-1" /> New Requirement
          </Button>
        </Link>
        <Link href="/admin/notifications">
          <Button variant="outline" style={{ borderColor: 'var(--border-default)', color: 'var(--brand-brown)' }}>
            <Send size={16} className="mr-1" /> Send Notification
          </Button>
        </Link>
      </div>
    </div>
  );
}
