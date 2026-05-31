import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments, auditLogs } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const Schema = z.object({
  actualDeliveredQty: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

// ONLY DELIVERY_TEAM can confirm delivery — admin cannot
export const PATCH = withAuth()(async (req: AuthenticatedRequest, params) => {
  if (req.user.role !== 'DELIVERY_TEAM') {
    return NextResponse.json(
      fail('Only Delivery Team members can confirm delivery receipt'),
      { status: 403 }
    );
  }

  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  if (!commitment) return NextResponse.json(fail('Not found'), { status: 404 });
  if (commitment.status !== 'DONE') {
    return NextResponse.json(fail('Commitment must be in DONE status to confirm delivery'), { status: 400 });
  }

  await db.update(commitments).set({
    status: 'RECEIVED',
    actualDeliveredQty: parsed.data.actualDeliveredQty,
    deliveryConfirmedBy: req.user.userId,
    deliveryConfirmedAt: new Date().toISOString(),
    adminFeedback: parsed.data.notes || commitment.adminFeedback,
    updatedAt: new Date().toISOString(),
  }).where(eq(commitments.id, id));

  await db.insert(auditLogs).values({
    id: uuidv4(),
    action: 'DELIVERY_CONFIRMED',
    entityType: 'commitment',
    entityId: id,
    performedBy: req.user.userId,
    details: JSON.stringify({
      committed: commitment.packetsCommitted,
      delivered: parsed.data.actualDeliveredQty,
      notes: parsed.data.notes,
    }),
  });

  const [updated] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});
