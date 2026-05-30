import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { rotiRequirements, commitments } from '../../../../../drizzle/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateRequirementSchema } from '@/lib/validations/requirements';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth()(async (req: AuthenticatedRequest) => {
  const isAdmin = req.user.role === 'ADMIN';

  // Mumineen only see OPEN requirements (issue #4: hide CLOSED/CANCELLED)
  const rows = isAdmin
    ? await db.select().from(rotiRequirements).orderBy(desc(rotiRequirements.deliveryDate))
    : await db.select().from(rotiRequirements)
        .where(eq(rotiRequirements.status, 'OPEN'))
        .orderBy(rotiRequirements.deliveryDate); // soonest first for mumineen (issue #5)

  const totals = await db.select({
    requirementId: commitments.requirementId,
    total: sql<number>`cast(sum(${commitments.packetsCommitted}) as integer)`,
  }).from(commitments).groupBy(commitments.requirementId);

  const totalMap = Object.fromEntries(totals.map(t => [t.requirementId, t.total]));
  return NextResponse.json(ok(rows.map(r => ({ ...r, totalCommitted: totalMap[r.id] || 0 }))));
});

export const POST = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreateRequirementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const id = uuidv4();
  await db.insert(rotiRequirements).values({ id, ...parsed.data, createdBy: req.user.userId });
  const [created] = await db.select().from(rotiRequirements).where(eq(rotiRequirements.id, id)).limit(1);
  return NextResponse.json(ok(created), { status: 201 });
});
