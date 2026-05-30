'use client';
import { CommitmentStatus } from '@/types';
import { Check, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/shared/RatingStars';

const STEPS: CommitmentStatus[] = ['PENDING', 'APPROVED', 'PREPARING', 'DONE', 'DELIVERED', 'RECEIVED'];

const STEP_LABELS: Record<CommitmentStatus, string> = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  PREPARING: 'Preparing',
  DONE: 'Ready to Deliver',
  DELIVERED: 'Delivered',
  RECEIVED: 'Received',
  REJECTED: 'Rejected',
};

interface CommitmentData {
  id: string;
  status: CommitmentStatus;
  packetsCommitted: number;
  requirementTitle?: string;
  requirementDeliveryDate?: string;
  rejectionReason?: string | null;
  adminFeedback?: string | null;
  adminRating?: number | null;
}

interface Props {
  commitment: CommitmentData;
  onUpdateStatus: (id: string, status: 'PREPARING' | 'DONE') => void;
  onResubmit: (id: string) => void;
}

export function CommitmentPipeline({ commitment, onUpdateStatus, onResubmit }: Props) {
  const currentIdx = STEPS.indexOf(commitment.status);

  return (
    <div className="bg-white rounded-xl border border-[var(--border-default)] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{commitment.requirementTitle || 'Requirement'}</h3>
          <p className="text-sm text-[var(--text-muted)]">{commitment.packetsCommitted} packets • Delivery: {commitment.requirementDeliveryDate}</p>
        </div>
      </div>

      {commitment.status === 'REJECTED' ? (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">Commitment Rejected</p>
            {commitment.rejectionReason && <p className="text-sm text-red-600 mt-1">{commitment.rejectionReason}</p>}
          </div>
          <Button size="sm" onClick={() => onResubmit(commitment.id)} className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)]">
            Re-submit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stepper */}
          <div className="flex items-center gap-1 flex-wrap">
            {STEPS.map((step, idx) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all
                  ${idx < currentIdx ? 'bg-green-100 text-green-700' : idx === currentIdx ? 'bg-[var(--brand-gold)] text-[var(--text-on-gold)]' : 'bg-gray-100 text-gray-400'}`}>
                  {idx < currentIdx ? <Check size={10} /> : <Clock size={10} />}
                  {STEP_LABELS[step]}
                </div>
                {idx < STEPS.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {commitment.status === 'PENDING' && (
            <p className="text-sm text-[var(--text-muted)] italic">Awaiting admin approval…</p>
          )}
          {commitment.status === 'APPROVED' && (
            <Button size="sm" onClick={() => onUpdateStatus(commitment.id, 'PREPARING')} className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)]">
              Start Preparing
            </Button>
          )}
          {commitment.status === 'PREPARING' && (
            <Button size="sm" onClick={() => onUpdateStatus(commitment.id, 'DONE')} className="bg-teal-500 text-white hover:bg-teal-600">
              Mark as Done & Ready to Deliver
            </Button>
          )}
          {commitment.status === 'DONE' && (
            <p className="text-sm text-teal-700 font-medium">✓ Ready — please deliver on {commitment.requirementDeliveryDate}</p>
          )}
          {commitment.status === 'RECEIVED' && (
            <p className="text-sm text-purple-700 font-medium">✓ JazakAllah Khair — your ROTI was received.</p>
          )}
        </div>
      )}
    </div>
  );
}
