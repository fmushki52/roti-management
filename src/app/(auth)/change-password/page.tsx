'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordSchema } from '@/lib/validations/auth';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type FormData = z.infer<typeof ChangePasswordSchema>;

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];

export default function ChangePasswordPage() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const { updateUser, accessToken } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const strength = getStrength(newPass);
  const rules = [
    { label: 'At least 8 characters', met: newPass.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPass) },
    { label: 'One number', met: /[0-9]/.test(newPass) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPass) },
  ];

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || 'Failed to change password');
      return;
    }
    updateUser({ mustChangePassword: false });
    toast.success('Password set! Welcome.');
    router.push('/mumineen/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, var(--brand-cream) 0%, var(--surface-page) 100%)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="FMB Logo" width={200} height={80} className="object-contain mb-3" />
          <h1 className="text-xl font-bold text-center" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-gold-deep)' }}>
            Welcome — Set Your Password
          </h1>
          <p className="text-sm text-center mt-1" style={{ color: 'var(--text-muted)' }}>
            Please set your password before continuing
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border" style={{ borderColor: 'var(--border-default)', boxShadow: '0 4px 24px rgba(184,150,12,0.12)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--text-secondary)' }}>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  {...register('newPassword')}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="border-[var(--border-default)] pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {newPass.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{STRENGTH_LABELS[strength]}</p>
                </div>
              )}

              {/* Rules */}
              <div className="space-y-1">
                {rules.map(rule => (
                  <div key={rule.label} className="flex items-center gap-2">
                    {rule.met ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-gray-300" />}
                    <span className={`text-xs ${rule.met ? 'text-green-600' : 'text-gray-400'}`}>{rule.label}</span>
                  </div>
                ))}
              </div>
              {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: 'var(--text-secondary)' }}>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="border-[var(--border-default)] pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting || strength < 4} className="w-full font-semibold"
              style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}>
              {isSubmitting ? 'Setting Password…' : 'Set Password & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
