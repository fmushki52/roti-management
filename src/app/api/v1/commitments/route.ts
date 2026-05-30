import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments, rotiRequirements, users } from '../../../../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateCommitmentSchema } from '@/lib/validations/commitments';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth()(async (req: AuthenticatedRequest) => {
  const isAdmin = req.user.role === 'ADMIN';
  const rows = await db.select({
    id: commitments.id,
    requirementId: commitments.requirementId,
    userId: commitments.userId,
    packetsCommitted: commitments.packetsCommitted,
    status: commitments.status,
    adminApproved: commitments.adminApproved,
    approvedAt: commitments.approvedAt,
    rejectionReason: commitments.rejectionReason,
    adminFeedback: commitments.adminFeedback,
    adminRating: commitments.adminRating,
    createdAt: commitments.createdAt,
    updatedAt: commitments.updatedAt,
    userName: users.name,
    requirementTitle: rotiRequirements.title,
    requirementDeliveryDate: rotiRequirements.deliveryDate,
  }).from(commitments)
    .leftJoin(users, eq(commitments.userId, users.id))
    .leftJoin(rotiRequirements, eq(commitments.requirementId, rotiRequirements.id))
    .where(isAdmin ? undefined : eq(commitments.userId, req.user.userId))
    .orderBy(desc(commitments.createdAt));

  return NextResponse.json(ok(rows));
});

export const POST = withAuth('MUMINEEN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreateCommitmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const [requirement] = await db.select().from(rotiRequirements).where(eq(rotiRequirements.id, parsed.data.requirementId)).limit(1);
  if (!requirement || requirement.status !== 'OPEN') return NextResponse.json(fail('Requirement not available'), { status: 400 });

  if (!requirement.allowMultipleCommits) {
    const [existing] = await db.select().from(commitments)
      .where(and(eq(commitments.requirementId, parsed.data.requirementId), eq(commitments.userId, req.user.userId)))
      .limit(1);
    if (existing) return NextResponse.json(fail('You have already committed to this requirement'), { status: 400 });
  }

  const id = uuidv4();
  await db.insert(commitments).values({ id, ...parsed.data, userId: req.user.userId });
  const [created] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(created), { status: 201 });
});
