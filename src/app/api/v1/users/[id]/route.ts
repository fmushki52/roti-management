import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { UpdateUserSchema } from '@/lib/validations/users';
import { ok, fail } from '@/lib/api/response';

export const GET = withAuth('ADMIN')(async (_req: AuthenticatedRequest, params) => {
  const [user] = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    isActive: users.isActive, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, params.id)).limit(1);
  if (!user) return NextResponse.json(fail('Not found'), { status: 404 });
  return NextResponse.json(ok(user));
});

export const PATCH = withAuth('ADMIN')(async (req: AuthenticatedRequest, params) => {
  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
  await db.update(users).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(users.id, params.id));
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, params.id)).limit(1);
  return NextResponse.json(ok(user));
});
