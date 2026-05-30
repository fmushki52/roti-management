'use client';
import { useState, useEffect } from 'react';
import { RotiRequirement } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/fetcher';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  requirement: RotiRequirement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CommitModal({ requirement, onClose, onSuccess }: Props) {
  const min = requirement?.minPacketsPerCommit ?? 1;
  const max = requirement?.maxPacketsPerCommit ?? undefined;

  const [packets, setPackets] = useState(min);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset to min when requirement changes
  useEffect(() => {
    setPackets(requirement?.minPacketsPerCommit ?? 1);
    setConfirmed(false);
  }, [requirement?.id]);

  const isValid = packets >= min && (!max || packets <= max) && confirmed;

  async function handleSubmit() {
    if (!requirement || !isValid) return;
    setLoading(true);
    const res = await apiFetch('/api/v1/commitments', {
      method: 'POST',
      body: JSON.stringify({ requirementId: requirement.id, packetsCommitted: packets }),
    });
    setLoading(false);
    if (res.success) {
      toast.success('Commitment submitted!');
      onSuccess();
    } else {
      toast.error(res.error || 'Failed to submit');
    }
  }

  return (
    <Dialog open={!!requirement} onOpenChange={() => onClose()}>
      <DialogContent className="bg-white border border-[var(--border-default)]">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>
            Commit to Contribute
          </DialogTitle>
        </DialogHeader>
        {requirement && (
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong>{requirement.title}</strong> — Delivery: {format(new Date(requirement.deliveryDate), 'dd MMM yyyy')}
            </p>

            <div className="space-y-1">
              <Label style={{ color: 'var(--text-primary)' }}>
                How many packets can you prepare and deliver?
              </Label>
              {/* Issue #2: show allowed range */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Allowed: <strong>{min}</strong>{max ? ` – ${max}` : '+'} packets
              </p>
              <Input
                type="number"
                min={min}
                max={max}
                value={packets}
                onChange={e => setPackets(Number(e.target.value))}
                className="border-[var(--border-default)]"
              />
              {packets < min && (
                <p className="text-red-500 text-xs">Minimum {min} packet(s) required</p>
              )}
              {max && packets > max && (
                <p className="text-red-500 text-xs">Maximum {max} packet(s) allowed</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                I confirm I will deliver on {format(new Date(requirement.deliveryDate), 'dd MMM yyyy')}
              </span>
            </label>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!isValid || loading}
                onClick={handleSubmit}
                className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)]"
              >
                {loading ? 'Submitting…' : 'Submit Commitment'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
