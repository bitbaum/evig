// @vitest-environment node
/**
 * evig's ways in on the shared runtime: the handlers `next-auth/react` calls,
 * answered by AccountKit, on the real migration chain (pgvector, citext) plus
 * the real cutover import and its mirror triggers.
 *
 * Needs a disposable PostgreSQL with every scripts/db/migrations file applied:
 *   EVIG_JOURNEY_DATABASE_URL=postgres://…  pnpm vitest run src/lib/auth/shared
 * CI's "Migration Drift Check" job runs it after applying the chain. Without
 * the variable it is skipped. It TRUNCATEs `users` (cascade): never point it at
 * a database anyone uses.
 */
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { createCompatClient } from '@bitbaum/accountkit/auth/compat-testing';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

const URL_ = process.env.EVIG_JOURNEY_DATABASE_URL;
const SITE = 'https://evig.example.test';
vi.hoisted(() => {
  const url = process.env.EVIG_JOURNEY_DATABASE_URL;
  if (url) {
    Object.assign(process.env, {
      DATABASE_URL: url,
      NEXT_PUBLIC_SITE_URL: 'https://evig.example.test',
      AUTH_SECRET: 'synthetic-evig-journey-secret-at-least-32-chars',
    });
    delete process.env.RESEND_API_KEY;
    delete process.env.ORANGECAT_OAUTH_CLIENT_ID;
    delete process.env.SIGNIN_CLIENT_ID;
  }
});

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, delete: () => undefined }),
}));

const PASSWORD = 'synthetic legacy password';
const STAFF = '00000000-0000-4000-8000-000000000001';
const UNVERIFIED_STAFF = '00000000-0000-4000-8000-000000000002';

describe.skipIf(!URL_)('evig on AccountKit (real PostgreSQL)', () => {
  let browser: ReturnType<typeof createCompatClient>;
  const compat = async () => (await import('../compat')).compat;

  async function exec(text: string, params: unknown[] = []) {
    const { getPool } = await import('@/lib/auth/db');
    return getPool().query(text, params);
  }

  afterAll(async () => {
    const { getPool } = await import('@/lib/auth/db');
    await getPool().end();
  });

  beforeEach(async () => {
    browser = createCompatClient({ compat: await compat(), site: SITE });
    await exec(`DROP TRIGGER IF EXISTS evig_accountkit_from_users ON users;
      DROP TRIGGER IF EXISTS evig_accountkit_to_users ON auth_users;
      DROP TRIGGER IF EXISTS evig_accountkit_delete_users ON auth_users;
      TRUNCATE auth_users, auth_accounts, auth_sessions, auth_verifications,
        auth_passkeys, auth_two_factors, users CASCADE`);
    const hash = await bcrypt.hash(PASSWORD, 4);
    await exec(
      `INSERT INTO users (id, email, name, "emailVerified", password_hash, is_staff, staff_permissions) VALUES
        ($1, 'Staff@Example.test', 'Staff', now(), $3, true, '{}'),
        ($2, 'unverified@example.test', 'New', NULL, $3, true, '{}')`,
      [STAFF, UNVERIFIED_STAFF, hash],
    );
    const client = await (await import('@/lib/auth/db')).getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(await readFile('scripts/db/accountkit-import.sql', 'utf8'));
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  const signIn = (email: string, password: string) =>
    browser.signIn('credentials', { email, password }, `${SITE}/dashboard/orders`);

  // Signed out reads as null; `{}` keeps the `.user` checks below short.
  const session = async () =>
    ((await browser.session()) ?? {}) as {
      user?: { id: string; isStaff: boolean; emailVerified: boolean; email: string };
    };

  test('an imported bcrypt account signs in with its old password and keeps staff', async () => {
    const result = await signIn('staff@example.test', PASSWORD);
    expect(result.url).toBe(`${SITE}/dashboard/orders`);
    const current = await session();
    expect(current.user).toMatchObject({ id: STAFF, isStaff: true, emailVerified: true });
  });

  test('without mail, an unverified account signs in but holds no staff power', async () => {
    expect((await signIn('unverified@example.test', PASSWORD)).url).toContain('/dashboard');
    expect((await session()).user).toMatchObject({ id: UNVERIFIED_STAFF, isStaff: false });
    // Verifying through evig's 6-digit code reaches the shared row and unlocks staff at once.
    await exec(`UPDATE users SET "emailVerified" = now() WHERE id = $1`, [UNVERIFIED_STAFF]);
    expect((await session()).user?.isStaff).toBe(true);
  });

  test('a wrong password answers in evig codes, and the lockout holds the right one', async () => {
    const wrong = await signIn('staff@example.test', 'not it');
    expect(wrong.url).toContain('code=invalid_credentials');
    for (let i = 0; i < 5; i += 1) await signIn('staff@example.test', 'not it');
    expect((await signIn('staff@example.test', PASSWORD)).url).toContain('code=account_locked');
  });

  test('a demotion applies on the next request, not at token expiry', async () => {
    await signIn('staff@example.test', PASSWORD);
    await exec(`UPDATE users SET is_staff = false WHERE id = $1`, [STAFF]);
    expect((await session()).user?.isStaff).toBe(false);
  });

  test('change-password goes through AccountKit and the old password stops working', async () => {
    await signIn('staff@example.test', PASSWORD);
    const changed = await (
      await compat()
    ).callShared(
      new Request(`${SITE}/api/auth/change-password`, {
        headers: { cookie: browser.cookie, origin: SITE },
      }),
      '/change-password',
      {
        currentPassword: PASSWORD,
        newPassword: 'changed through accountkit',
        revokeOtherSessions: true,
      },
    );
    expect(changed.status).toBe(200);
    browser.cookie = '';
    expect((await signIn('staff@example.test', PASSWORD)).url).toContain('invalid_credentials');
    expect((await signIn('staff@example.test', 'changed through accountkit')).url).toContain(
      '/dashboard',
    );
  });

  test("a users row written outside AccountKit (seeds, Loki's live proof) signs in", async () => {
    const { createUser } = await import('@/lib/auth/db');
    await createUser({
      email: 'fresh@example.test',
      name: 'Fresh',
      password_hash: await bcrypt.hash('fresh password', 4),
    });
    expect((await signIn('fresh@example.test', 'fresh password')).url).toContain('/dashboard');
  });

  test('sign-out ends the shared session', async () => {
    await signIn('staff@example.test', PASSWORD);
    await browser.signOut();
    expect((await session()).user).toBeUndefined();
  });

  test('a person AccountKit creates (first OrangeCat sign-in) gets an evig row', async () => {
    const { ensureEvigUser } = await import('../accounts');
    const id = '00000000-0000-4000-8000-0000000000aa';
    const actor = '00000000-0000-4000-8000-0000000000bb';
    await exec(
      `INSERT INTO auth_users (id, email, name) VALUES ($1, 'x@orangecat.invalid', 'cat')`,
      [id],
    );
    await ensureEvigUser({ userId: id, providerId: 'orangecat', accountId: actor });
    await ensureEvigUser({ userId: id, providerId: 'orangecat', accountId: actor });
    const { rows } = await exec(
      `SELECT orangecat_actor_id::text AS actor, "emailVerified" FROM users WHERE id = $1`,
      [id],
    );
    expect(rows).toEqual([{ actor, emailVerified: null }]);
  });

  test('a person a first email sign-in link creates gets an evig row, address confirmed', async () => {
    const { ensureEvigUser } = await import('../accounts');
    const { NO_SIGN_IN_METHOD } = await import('@bitbaum/accountkit/auth/server');
    const id = '00000000-0000-4000-8000-0000000000cc';
    await exec(
      `INSERT INTO auth_users (id, email, name, email_verified) VALUES ($1, 'link@example.test', '', true)`,
      [id],
    );
    await ensureEvigUser({ userId: id, providerId: NO_SIGN_IN_METHOD, accountId: id });
    const { rows } = await exec(
      `SELECT email::text AS email, is_staff, orangecat_actor_id, "emailVerified" IS NOT NULL AS verified
         FROM users WHERE id = $1`,
      [id],
    );
    expect(rows).toEqual([
      { email: 'link@example.test', is_staff: false, orangecat_actor_id: null, verified: true },
    ]);
  });

  // What AccountKit's screens send: JSON to its own endpoints, same cookie jar.
  let hop = 0;
  async function native(route: string, body: Record<string, unknown>) {
    hop += 1;
    const res = await (
      await compat()
    ).route.POST(
      new Request(`${SITE}/api/auth${route}`, {
        method: 'POST',
        headers: {
          origin: SITE,
          'content-type': 'application/json',
          'x-forwarded-for': `203.0.113.${hop % 250}`,
          cookie: browser.cookie,
        },
        body: JSON.stringify(body),
      }) as never,
    );
    const jar = new Map(
      browser.cookie
        .split('; ')
        .filter(Boolean)
        .map((part) => [part.slice(0, part.indexOf('=')), part.slice(part.indexOf('=') + 1)]),
    );
    for (const set of res.headers.getSetCookie()) {
      const [pair] = set.split(';');
      const name = pair.slice(0, pair.indexOf('='));
      const value = pair.slice(pair.indexOf('=') + 1);
      if (/max-age=0/i.test(set) || value === '') jar.delete(name);
      else jar.set(name, value);
    }
    browser.cookie = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
    return res;
  }

  test('a sign-up through AccountKit makes an evig customer with a profile, under the same id', async () => {
    const res = await native('/sign-up/email', {
      name: '',
      email: 'Fresh@Example.test',
      password: 'a brand new password',
    });
    expect(res.status).toBe(200);
    const { user } = await res.json();
    const { rows } = await exec(
      `SELECT email::text AS email, password_hash, is_staff, "emailVerified" FROM users WHERE id = $1`,
      [user.id],
    );
    expect(rows).toEqual([
      { email: 'fresh@example.test', password_hash: null, is_staff: false, emailVerified: null },
    ]);
    expect(
      (await exec('SELECT 1 FROM user_profiles WHERE user_id = $1', [user.id])).rows,
    ).toHaveLength(1);
    expect((await session()).user).toMatchObject({ id: user.id, isStaff: false });
    browser.cookie = '';
    expect(
      (
        await native('/sign-in/email', {
          email: 'fresh@example.test',
          password: 'a brand new password',
        })
      ).status,
    ).toBe(200);
  });

  test("AccountKit's form keeps evig's lockout: five wrong passwords lock the right one out", async () => {
    for (let i = 0; i < 5; i += 1) {
      const wrong = await native('/sign-in/email', { email: 'staff@example.test', password: 'no' });
      expect([401, 429]).toContain(wrong.status);
    }
    const locked = await native('/sign-in/email', {
      email: 'staff@example.test',
      password: PASSWORD,
    });
    expect(locked.status).toBe(429);
    expect((await locked.json()).code).toBe('ACCOUNT_LOCKED');
    expect((await session()).user).toBeUndefined();
    await exec('DELETE FROM user_lockouts');
    expect(
      (await native('/sign-in/email', { email: 'staff@example.test', password: PASSWORD })).status,
    ).toBe(200);
  });

  test('an IT-Hilfe claim link sets the first password through AccountKit and confirms the address', async () => {
    const { createUser, createPasswordResetToken } = await import('@/lib/auth/db');
    const person = await createUser({ email: 'requester@example.test' });
    const token = await createPasswordResetToken('requester@example.test', 7 * 24 * 3600 * 1000);
    const res = await native('/reset-password', { token, newPassword: 'my first password' });
    expect(res.status).toBe(200);
    const { rows } = await exec(
      `SELECT "emailVerified" IS NOT NULL AS verified FROM users WHERE id = $1`,
      [person.id],
    );
    expect(rows[0].verified).toBe(true);
    expect(
      (await exec('SELECT 1 FROM verification_tokens WHERE token = $1', [token])).rows,
    ).toHaveLength(0);
    expect(
      (
        await native('/sign-in/email', {
          email: 'requester@example.test',
          password: 'my first password',
        })
      ).status,
    ).toBe(200);
  });

  test('a claim link mailed before this release still works, and a 6-digit code never becomes one', async () => {
    const { createUser, createVerificationCode } = await import('@/lib/auth/db');
    await createUser({ email: 'early@example.test' });
    const token = 'ab'.repeat(32);
    await exec(
      `INSERT INTO verification_tokens (identifier, token, expires) VALUES ('early@example.test', $1, now() + interval '1 day')`,
      [token],
    );
    const { honourEvigResetLink } = await import('../reset-links');
    await honourEvigResetLink(token);
    await honourEvigResetLink(token);
    expect(
      (await native('/reset-password', { token, newPassword: 'set from an old link' })).status,
    ).toBe(200);
    expect((await native('/reset-password', { token, newPassword: 'twice' })).status).toBe(400);

    const code = await createVerificationCode('staff@example.test');
    await honourEvigResetLink(code);
    expect((await native('/reset-password', { token: code, newPassword: 'takeover' })).status).toBe(
      400,
    );
  });

  test('a team invitation claim sets the password through AccountKit', async () => {
    const { createUser } = await import('@/lib/auth/db');
    const { createClaimToken, consumeClaim } = await import('@/lib/services/team-invites');
    const placeholder = await createUser({
      email: 'stand-in@placeholder.revamp-it.ch',
      name: 'Stand-in',
    });
    const token = await createClaimToken(placeholder.id);
    expect(token).toBeTruthy();
    const claimed = await consumeClaim(token!, {
      name: 'Real Person',
      email: 'real@example.test',
      password: 'claimed password',
    });
    expect(claimed).toEqual({ success: true });
    expect(
      (await consumeClaim(token!, { name: 'x', email: 'y@example.test', password: 'z' })).success,
    ).toBe(false);
    expect(
      (await native('/sign-in/email', { email: 'real@example.test', password: 'claimed password' }))
        .status,
    ).toBe(200);
    expect((await session()).user).toMatchObject({ id: placeholder.id, emailVerified: true });
  });

  test("a rename through AccountKit's panel reaches evig's row", async () => {
    await native('/sign-in/email', { email: 'staff@example.test', password: PASSWORD });
    expect((await native('/update-user', { name: 'Panel Name' })).status).toBe(200);
    expect((await exec('SELECT name FROM users WHERE id = $1', [STAFF])).rows[0].name).toBe(
      'Panel Name',
    );
  });

  test('deleting an account through AccountKit deletes the evig account', async () => {
    await native('/sign-in/email', { email: 'unverified@example.test', password: PASSWORD });
    const res = await native('/delete-user', { password: PASSWORD });
    expect(res.status).toBe(200);
    expect((await exec('SELECT 1 FROM users WHERE id = $1', [UNVERIFIED_STAFF])).rows).toHaveLength(
      0,
    );
    expect(
      (await exec('SELECT 1 FROM auth_users WHERE id = $1', [UNVERIFIED_STAFF])).rows,
    ).toHaveLength(0);
    expect((await session()).user).toBeUndefined();
  });

  test('a super admin is refused deletion and keeps every way in', async () => {
    await exec('UPDATE users SET is_super_admin = true WHERE id = $1', [STAFF]);
    await native('/sign-in/email', { email: 'staff@example.test', password: PASSWORD });
    expect((await native('/delete-user', { password: PASSWORD })).status).toBe(403);
    expect(
      (await exec('SELECT 1 FROM auth_accounts WHERE user_id = $1', [STAFF])).rows,
    ).toHaveLength(1);
    expect((await session()).user?.id).toBe(STAFF);
  });

  test('every method is offered by env', async () => {
    const { evigMethods } = await import('../methods');
    expect(evigMethods()).toMatchObject({
      password: true,
      passkey: true,
      orangecat: false,
      signin: false,
    });
    expect(
      evigMethods({
        ...process.env,
        ORANGECAT_OAUTH_CLIENT_ID: 'evig',
        ORANGECAT_OAUTH_CLIENT_SECRET: 's',
        SIGNIN_ISSUER: 'https://signin.example.test',
        SIGNIN_CLIENT_ID: 'evig',
        SIGNIN_CLIENT_SECRET: 's',
      }),
      // The shared sign-in shows only once its service publishes a provider
      // (AccountKit 0.24+); this synthetic issuer publishes none.
    ).toMatchObject({ orangecat: true, signin: false, twoFactor: true });
  });

  test('with account mail on, an unconfirmed account still signs in (AccountKit default)', async () => {
    // AccountKit fixes its rule when the runtime starts, so this one runs on a
    // fresh runtime that sees a configured sender. Signing in sends no mail.
    process.env.RESEND_API_KEY = 're_synthetic_journey_key';
    vi.resetModules();
    try {
      const fresh = createCompatClient({ compat: await compat(), site: SITE });
      const body = await fresh.signIn(
        'credentials',
        { email: 'unverified@example.test', password: PASSWORD },
        `${SITE}/dashboard/orders`,
      );
      expect(body.url).toBe(`${SITE}/dashboard/orders`);
    } finally {
      delete process.env.RESEND_API_KEY;
      const { getPool } = await import('@/lib/auth/db');
      await getPool().end();
      vi.resetModules();
    }
  });

  test('OrangeCat is offered only once its client is configured', async () => {
    const { providers } = await compat();
    expect(Object.keys(providers())).toEqual(['credentials']);
    Object.assign(process.env, {
      ORANGECAT_OAUTH_CLIENT_ID: 'evig',
      ORANGECAT_OAUTH_CLIENT_SECRET: 's',
    });
    try {
      expect(Object.keys(providers()).sort()).toEqual(['credentials', 'orangecat']);
    } finally {
      delete process.env.ORANGECAT_OAUTH_CLIENT_ID;
      delete process.env.ORANGECAT_OAUTH_CLIENT_SECRET;
    }
  });
});
