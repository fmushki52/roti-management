import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { notifications } from '../../../../../../drizzle/schema';
import { eq, or, isNull, and, sql } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok } from '@/lib/api/response';

export const GET = withAuth()(async (req: AuthenticatedRequest) => {
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(
      eq(notifications.isRead, false),
      or(isNull(notifications.recipientId), eq(notifications.recipientId, req.user.userId))
    ));
  return NextResponse.json(ok({ count: result?.count || 0 }));
});
