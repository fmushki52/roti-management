import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { hashPassword, generateTempPassword } from '@/lib/auth/password';
import { ok } from '@/lib/api/response';

export const PATCH = withAuth('ADMIN')(async (_req: AuthenticatedRequest, params) => {
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  await db.update(users).set({ passwordHash: hash, mustChangePassword: true, updatedAt: new Date().toISOString() }).where(eq(users.id, params.id));
  return NextResponse.json(ok({ tempPassword }));
});
