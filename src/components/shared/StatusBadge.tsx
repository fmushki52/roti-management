import { CommitmentStatus, RequirementStatus } from '@/types';

type Status = CommitmentStatus | RequirementStatus;

const CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100',   text: 'text-amber-800' },
  APPROVED:  { label: 'Approved',  bg: 'bg-blue-100',    text: 'text-blue-800' },
  REJECTED:  { label: 'Rejected',  bg: 'bg-red-100',     text: 'text-red-800' },
  PREPARING: { label: 'Preparing', bg: 'bg-orange-100',  text: 'text-orange-800' },
  DONE:      { label: 'Done',      bg: 'bg-teal-100',    text: 'text-teal-800' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-100',   text: 'text-green-800' },
  RECEIVED:  { label: 'Received',  bg: 'bg-purple-100',  text: 'text-purple-800' },
  OPEN:      { label: 'Open',      bg: 'bg-green-100',   text: 'text-green-800' },
  CLOSED:    { label: 'Closed',    bg: 'bg-gray-100',    text: 'text-gray-700' },
  FULFILLED:  { label: 'Fulfilled',  bg: 'bg-teal-100',    text: 'text-teal-800' },
  CANCELLED:  { label: 'Cancelled', bg: 'bg-red-100',     text: 'text-red-700' },
};

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${px} ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
