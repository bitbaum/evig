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
      AUTH_RUNTIME: 'accountkit',
      AUTH_SECRET: 'synthetic-evig-journey-secret-at-least-32-chars',
    });
    delete process.env.RESEND_API_KEY;
    delete process.env.ORANGECAT_OAUTH_CLIENT_ID;
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

  test("evig's reset link writes the shared password and ends every session", async () => {
    await signIn('staff@example.test', PASSWORD);
    const { updateUserPassword } = await import('@/lib/auth/db');
    await updateUserPassword('staff@example.test', await bcrypt.hash('a new one', 4));
    expect((await session()).user).toBeUndefined();
    expect((await signIn('staff@example.test', PASSWORD)).url).toContain('invalid_credentials');
    expect((await signIn('staff@example.test', 'a new one')).url).toContain('/dashboard');
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

  test('a registration through evig signs in on the shared runtime', async () => {
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
