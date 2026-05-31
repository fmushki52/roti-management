import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { payments, commitments, users, rotiRequirements } from '../../../../../../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';

export const GET = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const format = url.searchParams.get('format') || 'json';

  if (!from || !to) return NextResponse.json(fail('from and to date params required'), { status: 400 });

  const rows = await db.select({
    id: payments.id,
    paymentDate: payments.paymentDate,
    amountOwed: payments.amountOwed,
    amountPaid: payments.amountPaid,
    paymentMethod: payments.paymentMethod,
    notes: payments.notes,
    userItsNumber: users.itsNumber,
    userName: users.name,
    requirementTitle: rotiRequirements.title,
    requirementDeliveryDate: rotiRequirements.deliveryDate,
    committedQty: commitments.packetsCommitted,
    deliveredQty: commitments.actualDeliveredQty,
  }).from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(rotiRequirements, eq(payments.requirementId, rotiRequirements.id))
    .leftJoin(commitments, eq(payments.commitmentId, commitments.id))
    .where(and(gte(payments.paymentDate, from), lte(payments.paymentDate, to)))
    .orderBy(users.name, rotiRequirements.deliveryDate);

  if (format === 'csv') {
    const header = 'ITS Number,Name,Requirement,Delivery Date,Committed,Delivered,Amount Owed (KD),Amount Paid (KD),Balance (KD),Payment Method,Payment Date,Notes\n';
    const body = rows.map(r => {
      const owed = parseFloat(r.amountOwed || '0');
      const paid = parseFloat(r.amountPaid || '0');
      const balance = (owed - paid).toFixed(3);
      return `"${r.userItsNumber || ''}","${r.userName || ''}","${r.requirementTitle || ''}","${r.requirementDeliveryDate || ''}",${r.committedQty || 0},${r.deliveredQty ?? ''},${owed.toFixed(3)},${paid.toFixed(3)},${balance},"${r.paymentMethod || ''}","${r.paymentDate || ''}","${r.notes || ''}"`;
    }).join('\n');
    return new NextResponse(header + body, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="payments-${from}-to-${to}.csv"` },
    });
  }

  return NextResponse.json(ok(rows));
});
