import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments, auditLogs, notifications, users } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const Schema = z.object({ reason: z.string().min(3, 'Reason is required') });

export const PATCH = withAuth('ADMIN')(async (req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  if (!commitment) return NextResponse.json(fail('Commitment not found'), { status: 404 });
  if (!['APPROVED', 'PREPARING'].includes(commitment.status)) {
    return NextResponse.json(fail('Only APPROVED or PREPARING commitments can be reversed'), { status: 400 });
  }

  // Reverse: set to REJECTED with reason
  await db.update(commitments).set({
    status: 'REJECTED',
    adminApproved: false,
    rejectionReason: `[Approval Reversed] ${parsed.data.reason}`,
    updatedAt: new Date().toISOString(),
  }).where(eq(commitments.id, id));

  // Audit log
  await db.insert(auditLogs).values({
    id: uuidv4(),
    action: 'APPROVAL_REVERSED',
    entityType: 'commitment',
    entityId: id,
    performedBy: req.user.userId,
    details: JSON.stringify({ reason: parsed.data.reason, previousStatus: commitment.status }),
  });

  // Notify the Mumineen
  const [performer] = await db.select({ name: users.name }).from(users).where(eq(users.id, req.user.userId)).limit(1);
  await db.insert(notifications).values({
    id: uuidv4(),
    title: 'Approval Reversed',
    message: `Your approval for this commitment has been reversed. Reason: ${parsed.data.reason}`,
    type: 'ALERT',
    senderId: req.user.userId,
    recipientId: commitment.userId,
  });

  const [updated] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});
