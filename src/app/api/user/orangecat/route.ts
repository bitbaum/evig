import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById } from '@/lib/auth/db';
import { logger } from '@/lib/logger';
import {
  ORANGECAT_LINK_COOKIE,
  ORANGECAT_LINK_TTL_SECONDS,
  isOrangeCatEnabled,
  mintLinkToken,
} from '@/lib/auth/orangecat';

/**
 * GET  /api/user/orangecat — is this account an OrangeCat account, and can it become one?
 * POST /api/user/orangecat — start "Connect OrangeCat" for the signed-in user:
 *      mints the short-lived signed cookie the sign-in callback reads, so the
 *      OrangeCat identity that comes back is attached to THIS account and no
 *      other. The client then starts the ordinary OrangeCat sign-in.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await getUserById(session.user.id);
  return NextResponse.json({
    success: true,
    data: { enabled: isOrangeCatEnabled(), linked: Boolean(user?.orangecat_actor_id) },
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOrangeCatEnabled()) {
    return NextResponse.json({ error: 'OrangeCat sign-in is not configured' }, { status: 503 });
  }
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    logger.error('AUTH_SECRET missing; cannot mint OrangeCat link token');
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(ORANGECAT_LINK_COOKIE, mintLinkToken(session.user.id, secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ORANGECAT_LINK_TTL_SECONDS,
  });
  return res;
}
