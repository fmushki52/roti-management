import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users, refreshTokens } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { LoginSchema } from '@/lib/validations/auth';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= 5 && now < attempts.resetAt) {
    return NextResponse.json(fail('Too many login attempts. Try again in 15 minutes.'), { status: 429 });
  }

  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
  }

  const { itsNumber, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.itsNumber, itsNumber)).limit(1);

  if (!user || !user.isActive) {
    const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    entry.count++;
    loginAttempts.set(ip, entry);
    return NextResponse.json(fail('Invalid ITS Number or password'), { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    entry.count++;
    loginAttempts.set(ip, entry);
    return NextResponse.json(fail('Invalid ITS Number or password'), { status: 401 });
  }

  loginAttempts.delete(ip);

  const accessToken = signAccessToken({ userId: user.id, role: user.role as 'ADMIN' | 'MUMINEEN', itsNumber: user.itsNumber });
  const rawRefresh = signRefreshToken({ userId: user.id });
  const tokenHash = await bcrypt.hash(rawRefresh, 10);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(refreshTokens).values({ id: uuidv4(), userId: user.id, tokenHash, expiresAt });
  await db.update(users).set({ lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));

  const res = NextResponse.json(ok({
    accessToken,
    user: {
      id: user.id,
      itsNumber: user.itsNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      avatarUrl: user.avatarUrl,
    },
  }));

  res.cookies.set('__fmb_refresh', rawRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  return res;
}
