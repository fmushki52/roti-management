'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateNotificationSchema } from '@/lib/validations/notifications';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetcher';
import { toast } from 'sonner';
import { User, NotificationType } from '@/types';

type FormData = z.infer<typeof CreateNotificationSchema>;

interface Props {
  users: User[];
  onSent: () => void;
}

const TYPE_OPTIONS: { value: NotificationType; label: string; color: string }[] = [
  { value: 'INFO', label: 'Info', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'SUCCESS', label: 'Success', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'WARNING', label: 'Warning', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'ALERT', label: 'Alert', color: 'bg-red-100 text-red-700 border-red-300' },
];

export function NotificationComposer({ users, onSent }: Props) {
  const [broadcastAll, setBroadcastAll] = useState(true);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(CreateNotificationSchema),
    defaultValues: { type: 'INFO' },
  });
  const type = watch('type');

  async function onSubmit(data: FormData) {
    const res = await apiFetch('/api/v1/notifications', { method: 'POST', body: JSON.stringify(broadcastAll ? { ...data, recipientId: undefined } : data) });
    if (res.success) {
      toast.success('Notification sent!');
      reset();
      onSent();
    } else {
      toast.error(res.error || 'Failed to send');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label>Title *</Label>
        <Input {...register('title')} placeholder="Notification title" className="border-[var(--border-default)]" />
        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Message *</Label>
        <Textarea {...register('message')} rows={4} placeholder="Notification message…" className="border-[var(--border-default)]" />
        {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Type</Label>
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map(opt => (
            <button type="button" key={opt.value} onClick={() => setValue('type', opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${type === opt.value ? opt.color : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Recipient</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={broadcastAll} onChange={e => setBroadcastAll(e.target.checked)} />
          <span className="text-sm text-[var(--text-secondary)]">All Mumineen (broadcast)</span>
        </label>
        {!broadcastAll && (
          <select {...register('recipientId')} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] bg-white">
            <option value="">Select Mumineen…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)] font-semibold">
        {isSubmitting ? 'Sending…' : 'Send Notification'}
      </Button>
    </form>
  );
}
