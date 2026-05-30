import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments } from '../../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { UpdateCommitmentStatusSchema } from '@/lib/validations/commitments';
import { ok, fail } from '@/lib/api/response';

export const PATCH = withAuth('MUMINEEN')(async (req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });

  const [commitment] = await db.select().from(commitments)
    .where(and(eq(commitments.id, id), eq(commitments.userId, req.user.userId))).limit(1);
  if (!commitment) return NextResponse.json(fail('Not found'), { status: 404 });

  const body = await req.json();
  const parsed = UpdateCommitmentStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const allowedTransitions: Record<string, string[]> = {
    APPROVED: ['PREPARING'],
    PREPARING: ['DONE'],
  };

  if (!allowedTransitions[commitment.status]?.includes(parsed.data.status)) {
    return NextResponse.json(fail(`Cannot transition from ${commitment.status} to ${parsed.data.status}`), { status: 400 });
  }

  await db.update(commitments).set({ status: parsed.data.status, updatedAt: new Date().toISOString() }).where(eq(commitments.id, id));
  const [updated] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});
