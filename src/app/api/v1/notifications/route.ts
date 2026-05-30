import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { notifications, users } from '../../../../../drizzle/schema';
import { eq, or, isNull, desc } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateNotificationSchema } from '@/lib/validations/notifications';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth()(async (req: AuthenticatedRequest) => {
  const rows = await db.select({
    id: notifications.id, title: notifications.title, message: notifications.message,
    type: notifications.type, senderId: notifications.senderId, recipientId: notifications.recipientId,
    isRead: notifications.isRead, createdAt: notifications.createdAt,
    senderName: users.name,
  }).from(notifications)
    .leftJoin(users, eq(notifications.senderId, users.id))
    .where(or(isNull(notifications.recipientId), eq(notifications.recipientId, req.user.userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  return NextResponse.json(ok(rows));
});

export const POST = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreateNotificationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const id = uuidv4();
  await db.insert(notifications).values({ id, ...parsed.data, senderId: req.user.userId });
  const [created] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return NextResponse.json(ok(created), { status: 201 });
});
