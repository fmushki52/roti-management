import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, JwtPayload } from './jwt';
import { fail } from '@/lib/api/response';

type Role = 'ADMIN' | 'MUMINEEN';

export type AuthenticatedRequest = NextRequest & {
  user: JwtPayload;
};

// In Next.js 16, params is a Promise
type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (req: AuthenticatedRequest, params: Record<string, string>) => Promise<NextResponse>;

export function withAuth(role?: Role) {
  return function (handler: RouteHandler) {
    return async function (req: NextRequest, context?: RouteContext) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(fail('Unauthorized'), { status: 401 });
      }

      const token = authHeader.slice(7);
      let payload: JwtPayload;

      try {
        payload = verifyAccessToken(token);
      } catch {
        return NextResponse.json(fail('Invalid or expired token'), { status: 401 });
      }

      if (role && payload.role !== role) {
        return NextResponse.json(fail('Forbidden'), { status: 403 });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = payload;

      // Await params since Next.js 16 makes them async
      const params = context?.params ? await context.params : {};
      return handler(authenticatedReq, params);
    };
  };
}
