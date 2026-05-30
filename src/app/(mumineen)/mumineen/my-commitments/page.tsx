'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { Commitment } from '@/types';
import { CommitmentPipeline } from '@/components/mumineen/CommitmentPipeline';
import { toast } from 'sonner';

export default function MyCommitmentsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-commitments'],
    queryFn: () => apiFetch<(Commitment & { requirementTitle?: string; requirementDeliveryDate?: string })[]>('/api/v1/commitments'),
  });

  const commitments = data?.data || [];

  async function updateStatus(id: string, status: 'PREPARING' | 'DONE') {
    const res = await apiFetch(`/api/v1/commitments/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
    if (res.success) {
      toast.success(`Status updated to ${status}`);
      qc.invalidateQueries({ queryKey: ['my-commitments'] });
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  }

  function resubmit(id: string) {
    toast.info('Please browse requirements to submit a new commitment');
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-[var(--brand-gold-light)] animate-pulse rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
        My Commitments
      </h2>
      {commitments.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg" style={{ fontFamily: 'Amiri, serif' }}>No commitments yet</p>
          <p className="text-sm mt-1">Go to Requirements to make your first commitment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commitments.map(c => (
            <CommitmentPipeline
              key={c.id}
              commitment={{
                ...c,
                requirementTitle: (c as any).requirementTitle,
                requirementDeliveryDate: (c as any).requirementDeliveryDate,
              }}
              onUpdateStatus={updateStatus}
              onResubmit={resubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
