import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users, refreshTokens } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { ok, fail } from '@/lib/api/response';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get('__fmb_refresh')?.value;
  if (!rawToken) return NextResponse.json(fail('No refresh token'), { status: 401 });

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    return NextResponse.json(fail('Invalid refresh token'), { status: 401 });
  }

  const tokens = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, payload.userId));
  let validToken = null;
  for (const t of tokens) {
    if (new Date(t.expiresAt) > new Date()) {
      const match = await bcrypt.compare(rawToken, t.tokenHash);
      if (match) { validToken = t; break; }
    }
  }

  if (!validToken) return NextResponse.json(fail('Invalid refresh token'), { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user || !user.isActive) return NextResponse.json(fail('User not found'), { status: 401 });

  const accessToken = signAccessToken({ userId: user.id, role: user.role as 'ADMIN' | 'MUMINEEN', itsNumber: user.itsNumber });
  return NextResponse.json(ok({ accessToken }));
}
