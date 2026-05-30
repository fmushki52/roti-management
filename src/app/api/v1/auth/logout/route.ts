import { NextRequest, NextResponse } from 'next/server';
import { ok } from '@/lib/api/response';

export async function POST(_req: NextRequest) {
  const res = NextResponse.json(ok(null));
  res.cookies.delete('__fmb_refresh');
  return res;
}
