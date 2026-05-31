'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRequirementSchema } from '@/lib/validations/requirements';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetcher';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type FormData = z.input<typeof CreateRequirementSchema>;

export function RequirementForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(CreateRequirementSchema),
    defaultValues: { allowMultipleCommits: false, minPacketsPerCommit: 1 },
  });

  async function onSubmit(data: FormData) {
    const res = await apiFetch('/api/v1/requirements', { method: 'POST', body: JSON.stringify(data) });
    if (res.success) {
      toast.success('Requirement created!');
      router.push('/admin/requirements');
    } else {
      toast.error(res.error || 'Failed to create');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <div className="space-y-1">
        <Label>Title *</Label>
        <Input {...register('title')} className="border-[var(--border-default)]" placeholder="e.g. Ashara Day 3 ROTI" />
        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={3} className="border-[var(--border-default)]" placeholder="Optional details…" />
      </div>
      <div className="space-y-1">
        <Label>Total Packets Required *</Label>
        <Input type="number" min={1} {...register('totalPacketsRequired', { valueAsNumber: true })} className="border-[var(--border-default)]" />
        {errors.totalPacketsRequired && <p className="text-red-500 text-xs">{errors.totalPacketsRequired.message}</p>}
      </div>

      {/* Issue #2: min/max packets per Mumineen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Min Packets per Mumineen</Label>
          <Input type="number" min={1} {...register('minPacketsPerCommit', { valueAsNumber: true })} className="border-[var(--border-default)]" placeholder="1" />
          {errors.minPacketsPerCommit && <p className="text-red-500 text-xs">{errors.minPacketsPerCommit.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Max Packets per Mumineen <span className="text-[var(--text-muted)] font-normal">(optional)</span></Label>
          <Input type="number" min={1} {...register('maxPacketsPerCommit', { valueAsNumber: true, setValueAs: v => v === '' || isNaN(v) ? undefined : Number(v) })} className="border-[var(--border-default)]" placeholder="No limit" />
          {errors.maxPacketsPerCommit && <p className="text-red-500 text-xs">{errors.maxPacketsPerCommit.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Amount per Packet (KD) <span className="text-[var(--text-muted)] font-normal text-xs">— admin only, not shown to Mumineen</span></Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>KD</span>
          <Input type="number" step="0.001" min="0" placeholder="0.000"
            {...register('amountPerPacket')}
            className="border-[var(--border-default)] pl-10" />
        </div>
        {errors.amountPerPacket && <p className="text-red-500 text-xs">{String(errors.amountPerPacket.message)}</p>}
      </div>

      <div className="space-y-1">
        <Label>Delivery Date *</Label>
        <Input type="date" {...register('deliveryDate')} className="border-[var(--border-default)]" />
        {errors.deliveryDate && <p className="text-red-500 text-xs">{errors.deliveryDate.message}</p>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('allowMultipleCommits')} className="w-4 h-4" />
        <span className="text-sm text-[var(--text-secondary)]">Allow Mumineen to make multiple commitments</span>
      </label>
      <Button type="submit" disabled={isSubmitting} className="bg-[var(--brand-gold)] text-[var(--text-on-gold)] hover:bg-[var(--brand-gold-deep)] font-semibold">
        {isSubmitting ? 'Creating…' : 'Create Requirement'}
      </Button>
    </form>
  );
}
