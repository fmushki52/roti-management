'use client';
import { CommitmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Clock, ThumbsUp, ChefHat, PackageCheck, Truck, Star, XCircle,
  ChevronRight,
} from 'lucide-react';

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_CONFIG: Record<CommitmentStatus, {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = {
  PENDING: {
    icon: <Clock size={22} />,
    label: 'Awaiting Approval',
    description: 'Your commitment has been submitted. The admin will review and approve it shortly.',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  APPROVED: {
    icon: <ThumbsUp size={22} />,
    label: 'Approved — Start Preparing',
    description: 'Your commitment is approved! Please begin preparing the ROTI packets.',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  PREPARING: {
    icon: <ChefHat size={22} />,
    label: 'In Preparation',
    description: 'You are currently preparing the ROTI. Once done and ready to deliver, tap the button below.',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
  },
  DONE: {
    icon: <PackageCheck size={22} />,
    label: 'Ready — Please Deliver',
    description: 'ROTI is ready! Please deliver it on the date shown below.',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
  },
  DELIVERED: {
    icon: <Truck size={22} />,
    label: 'Delivered',
    description: 'Delivered — waiting for admin to confirm receipt.',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
  },
  RECEIVED: {
    icon: <Star size={22} />,
    label: 'Received — JazakAllah Khair',
    description: 'Your ROTI has been received. JazakAllah Khair for your contribution!',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
  },
  REJECTED: {
    icon: <XCircle size={22} />,
    label: 'Commitment Rejected',
    description: 'Your commitment was not approved. Please see the reason below.',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
  },
};

/* ── Progress bar steps ──────────────────────────────────────────── */
const PROGRESS_STEPS: CommitmentStatus[] = ['PENDING', 'APPROVED', 'PREPARING', 'DONE', 'RECEIVED'];
const PROGRESS_LABELS: Partial<Record<CommitmentStatus, string>> = {
  PENDING: 'Submitted',
  APPROVED: 'Approved',
  PREPARING: 'Preparing',
  DONE: 'Ready',
  RECEIVED: 'Received',
};

interface CommitmentData {
  id: string;
  status: CommitmentStatus;
  packetsCommitted: number;
  requirementTitle?: string;
  requirementDeliveryDate?: string;
  rejectionReason?: string | null;
}

interface Props {
  commitment: CommitmentData;
  onUpdateStatus: (id: string, status: 'PREPARING' | 'DONE') => void;
  onResubmit: (id: string) => void;
}

export function CommitmentPipeline({ commitment, onUpdateStatus, onResubmit }: Props) {
  const cfg = STATUS_CONFIG[commitment.status];
  const progressIdx = PROGRESS_STEPS.indexOf(
    commitment.status === 'REJECTED' ? 'PENDING' : commitment.status
  );

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>

      {/* ── Requirement header ─────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold text-base" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
          {commitment.requirementTitle || 'Requirement'}
        </h3>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {commitment.packetsCommitted} packets &nbsp;·&nbsp; Delivery: <strong>{commitment.requirementDeliveryDate}</strong>
        </p>
      </div>

      {/* ── Progress steps (not for REJECTED) ──────────────────── */}
      {commitment.status !== 'REJECTED' && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-0">
            {PROGRESS_STEPS.map((step, idx) => {
              const done = idx < progressIdx;
              const current = idx === progressIdx;
              const isLast = idx === PROGRESS_STEPS.length - 1;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  {/* Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${done    ? 'bg-green-500 border-green-500 text-white'
                      : current ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--text-on-gold)]'
                      :           'border-gray-200 bg-gray-100 text-gray-400'}`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[9px] mt-1 font-medium text-center leading-tight max-w-[44px]
                      ${done ? 'text-green-600' : current ? 'text-[var(--brand-brown)]' : 'text-gray-400'}`}>
                      {PROGRESS_LABELS[step]}
                    </span>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${idx < progressIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Current status card ─────────────────────────────────── */}
      <div className="p-5">
        <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} border`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{cfg.description}</p>

              {/* Rejection reason */}
              {commitment.status === 'REJECTED' && commitment.rejectionReason && (
                <p className="text-sm mt-2 font-medium text-red-600">
                  Reason: {commitment.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Action buttons ──────────────────────────────────── */}
        <div className="mt-4">
          {commitment.status === 'APPROVED' && (
            <Button
              onClick={() => onUpdateStatus(commitment.id, 'PREPARING')}
              className="w-full py-3 font-bold text-base"
              style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}
            >
              <ChefHat size={18} className="mr-2" /> Start Preparing ROTI
            </Button>
          )}

          {commitment.status === 'PREPARING' && (
            <Button
              onClick={() => onUpdateStatus(commitment.id, 'DONE')}
              className="w-full py-3 font-bold text-base bg-teal-500 text-white hover:bg-teal-600"
            >
              <PackageCheck size={18} className="mr-2" /> Done — ROTI is Ready to Deliver
            </Button>
          )}

          {commitment.status === 'REJECTED' && (
            <Button
              onClick={() => onResubmit(commitment.id)}
              className="w-full py-3 font-bold text-base"
              style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}
            >
              Browse Requirements to Re-commit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
