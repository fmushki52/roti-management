'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/shared/RatingStars';
import { apiFetch } from '@/lib/api/fetcher';
import { toast } from 'sonner';

interface Props {
  commitmentId: string | null;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryFeedbackModal({ commitmentId, userName, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!commitmentId) return;
    setLoading(true);
    // Mark received
    await apiFetch(`/api/v1/commitments/${commitmentId}/received`, { method: 'PATCH' });
    // Submit feedback
    if (rating) {
      await apiFetch(`/api/v1/commitments/${commitmentId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      });
    }
    setLoading(false);
    toast.success('Marked as received!');
    onSuccess();
  }

  return (
    <Dialog open={!!commitmentId} onOpenChange={() => onClose()}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--brand-brown)]" style={{ fontFamily: 'Amiri, serif' }}>
            Mark Received — {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Rating</p>
            <RatingStars rating={rating} onChange={setRating} size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Feedback (optional)</p>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Any comments…" className="border-[var(--border-default)]" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={loading} onClick={handleSubmit} className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)]">
              {loading ? 'Saving…' : 'Save & Mark Received'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
