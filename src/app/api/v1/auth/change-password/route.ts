import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ChangePasswordSchema } from '@/lib/validations/auth';
import { hashPassword } from '@/lib/auth/password';
import { ok, fail } from '@/lib/api/response';

export const POST = withAuth()(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
  }

  const hash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({
    passwordHash: hash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, req.user.userId));

  return NextResponse.json(ok({ message: 'Password changed successfully' }));
});
