import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { rotiRequirements, commitments, users } from '../../../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { UpdateRequirementSchema } from '@/lib/validations/requirements';
import { ok, fail } from '@/lib/api/response';

export const GET = withAuth()(async (_req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });

  const [req_row] = await db.select().from(rotiRequirements).where(eq(rotiRequirements.id, id)).limit(1);
  if (!req_row) return NextResponse.json(fail('Not found'), { status: 404 });

  const commits = await db.select({
    id: commitments.id,
    requirementId: commitments.requirementId,
    userId: commitments.userId,
    packetsCommitted: commitments.packetsCommitted,
    status: commitments.status,
    adminApproved: commitments.adminApproved,
    approvedAt: commitments.approvedAt,
    approvedBy: commitments.approvedBy,
    rejectionReason: commitments.rejectionReason,
    adminFeedback: commitments.adminFeedback,
    adminRating: commitments.adminRating,
    createdAt: commitments.createdAt,
    updatedAt: commitments.updatedAt,
    userName: users.name,
    userItsNumber: users.itsNumber,
    userEmail: users.email,
  }).from(commitments)
    .leftJoin(users, eq(commitments.userId, users.id))
    .where(eq(commitments.requirementId, id))
    .orderBy(desc(commitments.createdAt));

  const totalCommitted = commits.reduce((s, c) => s + c.packetsCommitted, 0);
  return NextResponse.json(ok({ ...req_row, totalCommitted, commitments: commits }));
});

export const PATCH = withAuth('ADMIN')(async (req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });
  const body = await req.json();
  const parsed = UpdateRequirementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
  await db.update(rotiRequirements).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(rotiRequirements.id, id));
  const [updated] = await db.select().from(rotiRequirements).where(eq(rotiRequirements.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});

export const DELETE = withAuth('ADMIN')(async (_req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });
  await db.delete(rotiRequirements).where(eq(rotiRequirements.id, id));
  return NextResponse.json(ok(null));
});
