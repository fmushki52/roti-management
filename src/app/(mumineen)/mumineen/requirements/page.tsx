'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { RotiRequirement, Commitment } from '@/types';
import { RequirementCard } from '@/components/mumineen/RequirementCard';
import { CommitModal } from '@/components/mumineen/CommitModal';

export default function MumineenRequirementsPage() {
  const qc = useQueryClient();
  const [commitReq, setCommitReq] = useState<RotiRequirement | null>(null);

  const { data: reqRes, isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => apiFetch<RotiRequirement[]>('/api/v1/requirements'),
  });
  const { data: commitRes } = useQuery({
    queryKey: ['my-commitments'],
    queryFn: () => apiFetch<Commitment[]>('/api/v1/commitments'),
  });

  const requirements = reqRes?.data || [];
  const myCommitments = commitRes?.data || [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
        Open Requirements
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-[var(--brand-gold-light)] animate-pulse rounded-xl" />)}
        </div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg" style={{ fontFamily: 'Amiri, serif' }}>No open requirements at this time</p>
          <p className="text-sm mt-1">Check back soon for upcoming ROTI requirements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map(req => (
            <RequirementCard
              key={req.id}
              requirement={req}
              myCommitment={myCommitments.find(c => c.requirementId === req.id)}
              onCommit={setCommitReq}
            />
          ))}
        </div>
      )}

      <CommitModal
        requirement={commitReq}
        onClose={() => setCommitReq(null)}
        onSuccess={() => {
          setCommitReq(null);
          qc.invalidateQueries({ queryKey: ['my-commitments'] });
          qc.invalidateQueries({ queryKey: ['requirements'] });
        }}
      />
    </div>
  );
}
