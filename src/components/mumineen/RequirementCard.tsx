'use client';
import { RotiRequirement, Commitment } from '@/types';
import { Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

interface Props {
  requirement: RotiRequirement;
  myCommitment?: Commitment;
  onCommit: (req: RotiRequirement) => void;
}

export function RequirementCard({ requirement, myCommitment, onCommit }: Props) {
  const pct = requirement.totalPacketsRequired > 0
    ? Math.min(((requirement.totalCommitted || 0) / requirement.totalPacketsRequired) * 100, 100)
    : 0;

  const canCommit = requirement.status === 'OPEN' && (!myCommitment || requirement.allowMultipleCommits);

  return (
    <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow" style={{ borderLeft: '4px solid var(--brand-gold)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-[var(--brand-brown)] font-semibold" style={{ fontFamily: 'Amiri, serif' }}>{requirement.title}</h3>
        <StatusBadge status={requirement.status} />
      </div>

      {requirement.description && (
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{requirement.description}</p>
      )}

      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <span className="flex items-center gap-1"><Calendar size={13} /> {format(new Date(requirement.deliveryDate), 'dd MMM yyyy')}</span>
        <span className="flex items-center gap-1"><Package size={13} /> {requirement.totalPacketsRequired} packets needed</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>{requirement.totalCommitted || 0} committed</span>
          <span>{requirement.totalPacketsRequired} required</span>
        </div>
        <div className="h-2 bg-[var(--brand-gold-light)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--brand-gold)] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {myCommitment && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Your commitment:</span>
          <StatusBadge status={myCommitment.status} />
          <span className="text-xs text-[var(--text-secondary)]">{myCommitment.packetsCommitted} packets</span>
        </div>
      )}

      {canCommit && (
        <Button size="sm" onClick={() => onCommit(requirement)} className="w-full bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)] font-semibold">
          I will contribute
        </Button>
      )}
    </div>
  );
}
