/**
 * evig's screens on the shared runtime, unchanged.
 *
 * The pages use `next-auth/react` (signIn, signOut, useSession). With
 * AUTH_RUNTIME=accountkit those calls are answered here from AccountKit, so no
 * Auth.js credential writer runs beside the shared one and no page has to learn
 * a second protocol. AccountKit owns every hash, session, limiter and token.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { orangecatOidc } from '@bitbaum/accountkit/auth';
import { returnPath } from '@bitbaum/accountkit/orangecat';
import { PUBLIC_SITE_URL } from '@/config/urls';
import { getUserByEmail } from '@/lib/auth/db';
import { clearLockoutDb, isAccountLockedDb, recordFailedAttemptDb } from '@/lib/auth/lockout';
import { ORANGECAT_LINK_COOKIE, readLinkToken } from '@/lib/auth/orangecat';
import { ORANGECAT_PROVIDER_ID } from '@/lib/auth/orangecat-provider-id';
import { logger } from '@/lib/logger';
import { callShared } from './call';
import { sharedAuth } from './runtime';
import { sharedSessionFor } from './session';

export { callShared } from './call';

const LOGIN_PATH = '/auth/login';

function withCookies(response: NextResponse, setCookies: string[]) {
  for (const cookie of setCookies) response.headers.append('set-cookie', cookie);
  return response;
}

/** What next-auth/react reads: `error` and evig's login `code` from the URL. */
const loginRefusal = (code: string) =>
  NextResponse.json({
    url: `${PUBLIC_SITE_URL}${LOGIN_PATH}?error=CredentialsSignin&code=${code}`,
  });

/** A same-origin path from the client's callbackUrl, or the dashboard. */
function landing(callbackUrl: FormDataEntryValue | null | undefined): string {
  const raw = typeof callbackUrl === 'string' ? callbackUrl : '';
  let path = raw;
  try {
    const url = new URL(raw, PUBLIC_SITE_URL);
    if (url.origin === new URL(PUBLIC_SITE_URL).origin) path = url.pathname + url.search;
  } catch {
    path = '';
  }
  return returnPath(path, '/dashboard');
}

/**
 * Auth.js's client protocol, answered by the shared runtime. Returns null for
 * any other path, which then goes to AccountKit itself.
 */
export async function nextAuthClientCompat(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, '');
  if (request.method === 'GET' && path === '/session') {
    return NextResponse.json((await sharedSessionFor(request.headers)) ?? {});
  }
  if (request.method === 'GET' && path === '/csrf') {
    // AccountKit checks the request origin itself; the client only needs a value.
    return NextResponse.json({ csrfToken: 'accountkit' });
  }
  if (request.method === 'GET' && path === '/providers') {
    return NextResponse.json(providers());
  }
  if (request.method === 'POST' && path === '/signout') {
    const answer = await callShared(request, '/sign-out', {});
    return withCookies(NextResponse.json({ url: PUBLIC_SITE_URL }), answer.cookies);
  }
  if (request.method === 'POST' && path === '/callback/credentials') {
    const form = await request.formData().catch(() => null);
    const email = String(form?.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(form?.get('password') ?? '');
    return credentialSignIn(request, email, password, landing(form?.get('callbackUrl')));
  }
  if (request.method === 'POST' && path === `/signin/${ORANGECAT_PROVIDER_ID}`) {
    const form = await request.formData().catch(() => null);
    return orangecatSignIn(request, landing(form?.get('callbackUrl')));
  }
  return null;
}

/** The methods the login form may offer: OrangeCat only with its client configured. */
export function providers(env: Record<string, string | undefined> = process.env) {
  return {
    credentials: { id: 'credentials', name: 'Email & Passwort', type: 'credentials' },
    ...(orangecatOidc(env)
      ? { [ORANGECAT_PROVIDER_ID]: { id: ORANGECAT_PROVIDER_ID, name: 'OrangeCat', type: 'oidc' } }
      : {}),
  };
}

/** Password sign-in with evig's per-account lockout kept beside AccountKit's limiter. */
async function credentialSignIn(request: Request, email: string, password: string, next: string) {
  if (!email || !password) return loginRefusal('missing_fields');
  try {
    const user = await getUserByEmail(email);
    // Locked: refused even with the right password, and without asking AccountKit.
    if (user && (await isAccountLockedDb(user.id)).locked) return loginRefusal('account_locked');
    if (user && !user.password_hash) return loginRefusal('no_password');

    const answer = await callShared(request, '/sign-in/email', { email, password });
    if (answer.status === 200) {
      if (user) await clearLockoutDb(user.id);
      return withCookies(NextResponse.json({ url: `${PUBLIC_SITE_URL}${next}` }), answer.cookies);
    }
    if (answer.body.code === 'EMAIL_NOT_VERIFIED') return loginRefusal('email_unverified');
    if (answer.status >= 500) return loginRefusal('db_unavailable');
    if (user) await recordFailedAttemptDb(user.id, 'login');
    return loginRefusal('invalid_credentials');
  } catch (error) {
    logger.error('AUTH_DB_UNAVAILABLE', { provider: 'credentials', error });
    return loginRefusal('db_unavailable');
  }
}

/**
 * "Mit OrangeCat anmelden", or "Connect OrangeCat" from the profile: the
 * signed link cookie (set inside the session by /api/user/orangecat) names the
 * account the identity joins; AccountKit then links it to that session's user.
 */
async function orangecatSignIn(request: Request, next: string) {
  const jar = await cookies();
  const linkFor = readLinkToken(
    jar.get(ORANGECAT_LINK_COOKIE)?.value,
    // The same secret /api/user/orangecat signs the cookie with.
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '',
  );
  const session = linkFor ? await sharedSessionFor(request.headers) : null;
  const linking = Boolean(session && linkFor && session.user.id === linkFor);
  if (linkFor) jar.delete(ORANGECAT_LINK_COOKIE);

  const answer = linking
    ? await callShared(request, '/oauth2/link', {
        providerId: ORANGECAT_PROVIDER_ID,
        callbackURL: `${PUBLIC_SITE_URL}${next}`,
        errorCallbackURL: `${PUBLIC_SITE_URL}/dashboard/profile?orangecat=failed`,
      })
    : await callShared(request, '/sign-in/oauth2', {
        providerId: ORANGECAT_PROVIDER_ID,
        callbackURL: `${PUBLIC_SITE_URL}${next}`,
        errorCallbackURL: `${PUBLIC_SITE_URL}${LOGIN_PATH}`,
      });
  const url = typeof answer.body.url === 'string' ? answer.body.url : null;
  if (!url) return loginRefusal('db_unavailable');
  return withCookies(NextResponse.json({ url }), answer.cookies);
}
