import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { payments, commitments, users, rotiRequirements } from '../../../../../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const CreatePaymentSchema = z.object({
  commitmentId:  z.string().uuid(),
  amountOwed:    z.string().regex(/^\d+(\.\d{1,3})?$/).optional(),
  amountPaid:    z.string().regex(/^\d+(\.\d{1,3})?$/),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  paymentDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes:         z.string().max(500).optional(),
});

export const GET = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const rows = await db.select({
    id: payments.id,
    commitmentId: payments.commitmentId,
    userId: payments.userId,
    requirementId: payments.requirementId,
    amountOwed: payments.amountOwed,
    amountPaid: payments.amountPaid,
    paymentMethod: payments.paymentMethod,
    paymentDate: payments.paymentDate,
    paidBy: payments.paidBy,
    notes: payments.notes,
    createdAt: payments.createdAt,
    updatedAt: payments.updatedAt,
    userName: users.name,
    userItsNumber: users.itsNumber,
    requirementTitle: rotiRequirements.title,
    committedQty: commitments.packetsCommitted,
    deliveredQty: commitments.actualDeliveredQty,
  }).from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(rotiRequirements, eq(payments.requirementId, rotiRequirements.id))
    .leftJoin(commitments, eq(payments.commitmentId, commitments.id))
    .orderBy(desc(payments.paymentDate));

  return NextResponse.json(ok(rows));
});

export const POST = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreatePaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  // Get commitment to find userId and requirementId
  const [commitment] = await db.select().from(commitments).where(eq(commitments.id, parsed.data.commitmentId)).limit(1);
  if (!commitment) return NextResponse.json(fail('Commitment not found'), { status: 404 });

  const id = uuidv4();
  await db.insert(payments).values({
    id,
    commitmentId: parsed.data.commitmentId,
    userId: commitment.userId,
    requirementId: commitment.requirementId,
    amountOwed: parsed.data.amountOwed || null,
    amountPaid: parsed.data.amountPaid,
    paymentMethod: parsed.data.paymentMethod,
    paymentDate: parsed.data.paymentDate,
    paidBy: req.user.userId,
    notes: parsed.data.notes || null,
  });

  const [created] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return NextResponse.json(ok(created), { status: 201 });
});
