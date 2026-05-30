'use client';
import { useState } from 'react';
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
  const [packets, setPackets] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!requirement || !confirmed) return;
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
          <DialogTitle className="font-display text-[var(--brand-brown)]" style={{ fontFamily: 'Amiri, serif' }}>
            Commit to Contribute
          </DialogTitle>
        </DialogHeader>
        {requirement && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-[var(--text-secondary)]"><strong>{requirement.title}</strong> — Delivery: {format(new Date(requirement.deliveryDate), 'dd MMM yyyy')}</p>
            <div className="space-y-1">
              <Label className="text-[var(--text-primary)]">How many packets can you prepare and deliver?</Label>
              <Input type="number" min={1} value={packets} onChange={e => setPackets(Number(e.target.value))} className="border-[var(--border-default)]" />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
              <span className="text-sm text-[var(--text-secondary)]">
                I confirm I will deliver on {format(new Date(requirement.deliveryDate), 'dd MMM yyyy')}
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={!confirmed || loading} onClick={handleSubmit} className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)]">
                {loading ? 'Submitting…' : 'Submit Commitment'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
