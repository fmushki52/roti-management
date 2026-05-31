'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/fetcher';
import { User } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
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
import { Plus, Copy, RotateCcw, UserX, UserCheck, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

type FormData = z.input<typeof CreateUserSchema>;

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  let pwd = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + digits[Math.floor(Math.random() * digits.length)]
    + special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 12; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [slideOpen, setSlideOpen] = useState(false);
  const [tempPassModal, setTempPassModal] = useState<{ name: string; itsNumber: string; password: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/api/v1/users'),
  });

  const users = (data?.data || []) as (User & Record<string, unknown>)[];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'MUMINEEN' },
  });

  function autoGeneratePassword() {
    // Admin can auto-generate password during user creation
    const pwd = generatePassword();
    // We'll show it in the temp password modal after creation
    return pwd;
  }

  async function onCreate(formData: FormData) {
    const res = await apiFetch<{ tempPassword: string; name: string; itsNumber: string }>('/api/v1/users', {
      method: 'POST', body: JSON.stringify(formData),
    });
    if (res.success && res.data) {
      setTempPassModal({ name: res.data.name, itsNumber: res.data.itsNumber, password: res.data.tempPassword });
      qc.invalidateQueries({ queryKey: ['users'] });
      setSlideOpen(false);
      reset();
    } else {
      toast.error(res.error || 'Failed to create user');
    }
  }

  async function resetPassword(userId: string, userName: string) {
    const res = await apiFetch<{ tempPassword: string }>(`/api/v1/users/${userId}/reset-password`, { method: 'PATCH' });
    if (res.success && res.data) setTempPassModal({ name: userName, itsNumber: '', password: res.data.tempPassword });
    else toast.error('Failed to reset password');
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const endpoint = isActive ? 'deactivate' : 'reactivate';
    const res = await apiFetch(`/api/v1/users/${userId}/${endpoint}`, { method: 'PATCH' });
    if (res.success) { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(isActive ? 'User deactivated' : 'User reactivated'); }
    else toast.error('Failed');
  }

  const columns = [
    {
      key: 'itsNumber', header: 'ITS Number',
      cell: (u: User) => <span className="font-mono font-semibold tracking-wider" style={{ color: 'var(--brand-brown)' }}>{u.itsNumber}</span>
    },
    {
      key: 'name', header: 'Name',
      cell: (u: User) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
    },
    {
      key: 'email', header: 'Email',
      cell: (u: User) => <span style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</span>
    },
    {
      key: 'role', header: 'Role',
      cell: (u: User) => <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{u.role}</span>
    },
    {
      key: 'isActive', header: 'Status',
      cell: (u: User) => u.isActive
        ? <span className="text-xs text-green-600 font-medium">Active</span>
        : <span className="text-xs text-red-500 font-medium">Inactive</span>
    },
    {
      key: 'lastLoginAt', header: 'Last Login',
      cell: (u: User) => u.lastLoginAt ? format(new Date(u.lastLoginAt), 'dd MMM yyyy') : '—'
    },
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
        <SheetContent className="bg-white w-[400px]">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Create Mumineen Account</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-6">
            <div className="space-y-1">
              <Label>ITS Number * <span className="text-[var(--text-muted)] font-normal text-xs">(8 digits)</span></Label>
              <Input
                {...register('itsNumber')}
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="12345678"
                className="border-[var(--border-default)] font-mono tracking-widest text-center"
              />
              {errors.itsNumber && <p className="text-red-500 text-xs">{errors.itsNumber.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input {...register('name')} placeholder="Ibrahim Hussain" className="border-[var(--border-default)]" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email <span className="text-[var(--text-muted)] font-normal text-xs">(optional)</span></Label>
              <Input {...register('email')} type="email" placeholder="user@example.com" className="border-[var(--border-default)]" />
              {errors.email && <p className="text-red-500 text-xs">{String(errors.email.message)}</p>}
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select {...register('role')} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm bg-white">
                <option value="MUMINEEN">Mumineen</option>
                <option value="ADMIN">Admin</option>
                <option value="DELIVERY_TEAM">Delivery Team</option>
              </select>
            </div>
            <p className="text-xs p-3 bg-[var(--brand-cream)] rounded-lg" style={{ color: 'var(--text-muted)' }}>
              A temporary password will be auto-generated. Share it with the Mumineen — they must change it on first login.
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full font-semibold" style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
              {isSubmitting ? 'Creating…' : 'Create Account & Generate Password'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Temp password reveal modal */}
      <Dialog open={!!tempPassModal} onOpenChange={() => setTempPassModal(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)' }}>Account Created</DialogTitle>
          </DialogHeader>
          {tempPassModal && (
            <div className="space-y-4 mt-2">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Account for <strong>{tempPassModal.name}</strong> created. Share these credentials — the password must be changed on first login.
              </p>
              <div className="space-y-2">
                {tempPassModal.itsNumber && (
                  <div className="flex items-center justify-between p-3 bg-[var(--brand-cream)] rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">ITS Number</p>
                      <code className="font-mono font-bold tracking-widest" style={{ color: 'var(--brand-brown)' }}>{tempPassModal.itsNumber}</code>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(tempPassModal.itsNumber); toast.success('Copied!'); }}>
                      <Copy size={14} />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-[var(--brand-cream)] rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Temporary Password</p>
                    <code className="font-mono text-sm" style={{ color: 'var(--brand-brown)' }}>{tempPassModal.password}</code>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(tempPassModal.password); toast.success('Copied!'); }}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                ⚠ This password will not be shown again. Copy it now.
              </p>
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
