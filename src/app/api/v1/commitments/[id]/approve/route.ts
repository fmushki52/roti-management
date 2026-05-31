import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments, notifications } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const Schema = z.object({
  paymentExempt: z.boolean().optional(),
}).optional();

export const PATCH = withAuth('ADMIN')(async (req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  const paymentExempt = parsed.success ? (parsed.data?.paymentExempt ?? false) : false;

  const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  if (!commitment) return NextResponse.json(fail('Not found'), { status: 404 });

  await db.update(commitments).set({
    status: 'APPROVED',
    adminApproved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: req.user.userId,
    paymentExempt,
    rejectionReason: null,
    updatedAt: new Date().toISOString(),
  }).where(eq(commitments.id, id));

  // Notify the Mumineen automatically (#3)
  await db.insert(notifications).values({
    id: uuidv4(),
    title: 'Commitment Approved ✓',
    message: `JazakAllah Khair! Your commitment of ${commitment.packetsCommitted} packets has been approved. Please begin preparation.`,
    type: 'SUCCESS',
    senderId: req.user.userId,
    recipientId: commitment.userId,
  });

  const [updated] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});
