import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok } from '@/lib/api/response';

export const PATCH = withAuth('ADMIN')(async (_req: AuthenticatedRequest, params) => {
  await db.update(users).set({ isActive: true, updatedAt: new Date().toISOString() }).where(eq(users.id, params.id));
  return NextResponse.json(ok({ message: 'User reactivated' }));
});
