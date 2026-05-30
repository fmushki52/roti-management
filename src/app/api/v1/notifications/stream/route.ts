import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { notifications } from '../../../../../../drizzle/schema';
import { eq, or, isNull, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return new Response('Unauthorized', { status: 401 });

  let user: { userId: string; role: string };
  try {
    user = verifyAccessToken(token);
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      const [result] = await db.select({ count: sql<number>`count(*)` }).from(notifications)
        .where(and(eq(notifications.isRead, false), or(isNull(notifications.recipientId), eq(notifications.recipientId, user.userId))));
      send('unread-count', { count: result?.count || 0 });

      const interval = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keep-alive\n\n')); } catch { clearInterval(interval); }
      }, 30000);

      req.signal.addEventListener('abort', () => { clearInterval(interval); try { controller.close(); } catch {} });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
