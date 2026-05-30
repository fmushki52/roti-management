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
    defaultValues: { allowMultipleCommits: false },
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
        <Input type="number" {...register('totalPacketsRequired', { valueAsNumber: true })} className="border-[var(--border-default)]" />
        {errors.totalPacketsRequired && <p className="text-red-500 text-xs">{errors.totalPacketsRequired.message}</p>}
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
