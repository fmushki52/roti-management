'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { User } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema } from '@/lib/validations/users';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Copy, RotateCcw, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

type FormData = z.input<typeof CreateUserSchema>;

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [slideOpen, setSlideOpen] = useState(false);
  const [tempPassModal, setTempPassModal] = useState<{ name: string; password: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/api/v1/users'),
  });

  const users = (data?.data || []) as (User & Record<string, unknown>)[];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'MUMINEEN' },
  });

  async function onCreate(formData: FormData) {
    const res = await apiFetch<{ tempPassword: string; name: string }>('/api/v1/users', {
      method: 'POST', body: JSON.stringify(formData),
    });
    if (res.success && res.data) {
      setTempPassModal({ name: res.data.name, password: res.data.tempPassword });
      qc.invalidateQueries({ queryKey: ['users'] });
      setSlideOpen(false);
      reset();
    } else {
      toast.error(res.error || 'Failed to create user');
    }
  }

  async function resetPassword(userId: string, userName: string) {
    const res = await apiFetch<{ tempPassword: string }>(`/api/v1/users/${userId}/reset-password`, { method: 'PATCH' });
    if (res.success && res.data) setTempPassModal({ name: userName, password: res.data.tempPassword });
    else toast.error('Failed to reset password');
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const endpoint = isActive ? 'deactivate' : 'reactivate';
    const res = await apiFetch(`/api/v1/users/${userId}/${endpoint}`, { method: 'PATCH' });
    if (res.success) { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(isActive ? 'User deactivated' : 'User reactivated'); }
    else toast.error('Failed');
  }

  const columns = [
    { key: 'name', header: 'Name', cell: (u: User) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span> },
    { key: 'email', header: 'Email', cell: (u: User) => <span style={{ color: 'var(--text-secondary)' }}>{u.email}</span> },
    { key: 'role', header: 'Role', cell: (u: User) => <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{u.role}</span> },
    { key: 'isActive', header: 'Status', cell: (u: User) => u.isActive ? <span className="text-xs text-green-600 font-medium">Active</span> : <span className="text-xs text-red-500 font-medium">Inactive</span> },
    { key: 'lastLoginAt', header: 'Last Login', cell: (u: User) => u.lastLoginAt ? format(new Date(u.lastLoginAt), 'dd MMM yyyy') : '—' },
    {
      key: 'actions', header: 'Actions',
      cell: (u: User) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => resetPassword(u.id, u.name)} title="Reset Password">
            <RotateCcw size={13} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggleActive(u.id, u.isActive!)} title={u.isActive ? 'Deactivate' : 'Reactivate'}>
            {u.isActive ? <UserX size={13} className="text-red-500" /> : <UserCheck size={13} className="text-green-500" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
          Mumineen Accounts
        </h2>
        <Button onClick={() => setSlideOpen(true)} className="font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
          <Plus size={16} className="mr-1" /> New Mumineen
        </Button>
      </div>
      <DataTable columns={columns as any} data={users} searchKey="name" loading={isLoading} />

      {/* Create slide-over */}
      <Sheet open={slideOpen} onOpenChange={setSlideOpen}>
        <SheetContent className="bg-white w-[380px]">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Create Mumineen Account</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-6">
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input {...register('name')} placeholder="Ibrahim Hussain" className="border-[var(--border-default)]" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input {...register('email')} type="email" placeholder="user@fmb-salmiya.org" className="border-[var(--border-default)]" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select {...register('role')} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm bg-white">
                <option value="MUMINEEN">Mumineen</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
              {isSubmitting ? 'Creating…' : 'Create Account'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Temp password modal */}
      <Dialog open={!!tempPassModal} onOpenChange={() => setTempPassModal(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Temporary Password</DialogTitle>
          </DialogHeader>
          {tempPassModal && (
            <div className="space-y-4 mt-2">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Share this password with <strong>{tempPassModal.name}</strong>. They will be asked to change it on first login.
              </p>
              <div className="flex items-center gap-2 p-3 bg-[var(--brand-cream)] rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                <code className="flex-1 font-mono text-sm" style={{ color: 'var(--brand-brown)' }}>{tempPassModal.password}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(tempPassModal.password); toast.success('Copied!'); }}>
                  <Copy size={14} />
                </Button>
              </div>
              <Button onClick={() => setTempPassModal(null)} className="w-full" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
