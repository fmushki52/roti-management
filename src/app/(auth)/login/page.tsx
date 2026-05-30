'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@/lib/validations/auth';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type FormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const json = await res.json();

    if (!json.success) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      toast.error(json.error || 'Login failed');
      return;
    }

    const { accessToken, user } = json.data;
    localStorage.setItem('accessToken', accessToken);
    setAuth(user, accessToken);

    if (user.mustChangePassword) {
      router.push('/change-password');
    } else if (user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/mumineen/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, var(--brand-cream) 0%, var(--surface-page) 100%)' }}>
      <div className={`w-full max-w-md ${shake ? 'shake' : ''}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="FMB Logo" width={240} height={96} className="object-contain mb-3" priority />
          <p className="text-sm text-center mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Amiri, serif' }}>
            Badri Mohallah Salmiya — ROTI Management
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border" style={{ borderColor: 'var(--border-default)', boxShadow: '0 4px 24px rgba(184,150,12,0.12)' }}>
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)', fontFamily: 'Amiri, serif' }}>
            Sign In
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: 'var(--text-secondary)' }}>Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="your@email.com"
                className="border-[var(--border-default)] focus:border-[var(--brand-gold-deep)] focus:ring-[var(--brand-gold-deep)]"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: 'var(--text-secondary)' }}>Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="border-[var(--border-default)] focus:border-[var(--brand-gold-deep)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-semibold py-2.5"
              style={{ background: 'var(--brand-gold)', color: 'var(--text-on-gold)' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          © FMB Salmiya — All rights reserved
        </p>
      </div>
    </div>
  );
}
