import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { notifications } from '../../../../../../drizzle/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok } from '@/lib/api/response';

export const PATCH = withAuth()(async (req: AuthenticatedRequest) => {
  await db.update(notifications).set({ isRead: true })
    .where(or(isNull(notifications.recipientId), eq(notifications.recipientId, req.user.userId)));
  return NextResponse.json(ok(null));
});
