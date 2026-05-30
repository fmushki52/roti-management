import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments } from '../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { RejectCommitmentSchema } from '@/lib/validations/commitments';
import { ok, fail } from '@/lib/api/response';

export const PATCH = withAuth('ADMIN')(async (req: AuthenticatedRequest, params) => {
  const { id } = params;
  if (!id) return NextResponse.json(fail('Missing id'), { status: 400 });
  const body = await req.json();
  const parsed = RejectCommitmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
  await db.update(commitments).set({
    status: 'REJECTED', rejectionReason: parsed.data.reason, updatedAt: new Date().toISOString(),
  }).where(eq(commitments.id, id));
  const [updated] = await db.select().from(commitments).where(eq(commitments.id, id)).limit(1);
  return NextResponse.json(ok(updated));
});
