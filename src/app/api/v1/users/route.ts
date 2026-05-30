import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateUserSchema } from '@/lib/validations/users';
import { hashPassword, generateTempPassword } from '@/lib/auth/password';
import { ok, fail } from '@/lib/api/response';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAuth('ADMIN')(async (_req: AuthenticatedRequest) => {
  const rows = await db.select({
    id: users.id, itsNumber: users.itsNumber, name: users.name, email: users.email,
    role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt, mustChangePassword: users.mustChangePassword,
  }).from(users).orderBy(desc(users.createdAt));
  return NextResponse.json(ok(rows));
});

export const POST = withAuth('ADMIN')(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });

  // Check ITS number uniqueness
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.itsNumber, parsed.data.itsNumber)).limit(1);
  if (existing) return NextResponse.json(fail('ITS Number already registered'), { status: 409 });

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const id = uuidv4();

  await db.insert(users).values({
    id,
    itsNumber: parsed.data.itsNumber,
    name: parsed.data.name,
    email: parsed.data.email || null,
    role: parsed.data.role,
    passwordHash: hash,
    mustChangePassword: true,
  });

  return NextResponse.json(ok({ id, itsNumber: parsed.data.itsNumber, name: parsed.data.name, tempPassword }), { status: 201 });
});
