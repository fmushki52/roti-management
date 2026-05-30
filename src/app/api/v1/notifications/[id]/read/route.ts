import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { notifications } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok } from '@/lib/api/response';

export const PATCH = withAuth()(async (_req: AuthenticatedRequest, params) => {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, params.id));
  return NextResponse.json(ok(null));
});
