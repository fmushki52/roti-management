import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { commitments, users, rotiRequirements } from '../../../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { fail } from '@/lib/api/response';

export const GET = withAuth('ADMIN')(async (_req: AuthenticatedRequest, params) => {
  const { id } = params;
  const [req_row] = await db.select().from(rotiRequirements).where(eq(rotiRequirements.id, id)).limit(1);
  if (!req_row) return NextResponse.json(fail('Not found'), { status: 404 });

  const rows = await db.select({
    name: users.name, email: users.email,
    packets: commitments.packetsCommitted, status: commitments.status,
    submittedAt: commitments.createdAt, rating: commitments.adminRating, feedback: commitments.adminFeedback,
  }).from(commitments)
    .leftJoin(users, eq(commitments.userId, users.id))
    .where(eq(commitments.requirementId, id));

  const header = 'Name,Email,Packets Committed,Status,Submitted At,Rating,Feedback\n';
  const body = rows.map(r =>
    `"${r.name || ''}","${r.email || ''}",${r.packets},"${r.status}","${r.submittedAt}",${r.rating || ''},"${r.feedback || ''}"`
  ).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="report-${id}.csv"`,
    },
  });
});
