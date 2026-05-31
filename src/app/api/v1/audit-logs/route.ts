import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { auditLogs, users } from '../../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok } from '@/lib/api/response';

export const GET = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const entityId = url.searchParams.get('entityId');

  let query = db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    performedBy: auditLogs.performedBy,
    details: auditLogs.details,
    createdAt: auditLogs.createdAt,
    performerName: users.name,
    performerIts: users.itsNumber,
  }).from(auditLogs)
    .leftJoin(users, eq(auditLogs.performedBy, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  const rows = await query;
  const filtered = entityId ? rows.filter(r => r.entityId === entityId) : rows;
  return NextResponse.json(ok(filtered));
});
