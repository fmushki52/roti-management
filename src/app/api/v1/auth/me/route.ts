import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ok, fail } from '@/lib/api/response';

export const GET = withAuth()(async (req: AuthenticatedRequest) => {
  const [user] = await db.select({
    id: users.id, itsNumber: users.itsNumber, name: users.name, email: users.email,
    role: users.role, mustChangePassword: users.mustChangePassword, avatarUrl: users.avatarUrl,
    isActive: users.isActive, lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt, updatedAt: users.updatedAt,
  }).from(users).where(eq(users.id, req.user.userId)).limit(1);

  if (!user) return NextResponse.json(fail('User not found'), { status: 404 });
  return NextResponse.json(ok(user));
});
