import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../drizzle/schema';
import { desc } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateUserSchema } from '@/lib/validations/users';
import { hashPassword, generateTempPassword } from '@/lib/auth/password';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth('ADMIN')(async (_req: AuthenticatedRequest) => {
  const rows = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role,
    isActive: users.isActive, lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt, mustChangePassword: users.mustChangePassword,
  }).from(users).orderBy(desc(users.createdAt));
  return NextResponse.json(ok(rows));
});

export const POST = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const id = uuidv4();
  await db.insert(users).values({ id, ...parsed.data, passwordHash: hash, mustChangePassword: true });
  return NextResponse.json(ok({ id, ...parsed.data, tempPassword }), { status: 201 });
});
