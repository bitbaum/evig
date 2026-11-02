import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

/**
 * Every way into an evig account, on AccountKit's own screens, in a real
 * Chromium against the production build and the database the e2e-local job
 * builds from the migrations, its seed and the cutover import
 * (.github/workflows/ci.yml):
 *
 *   - /auth/login, /auth/register and /auth/forgot-password at 320px and
 *     390px: no sideways scroll, and the methods the env asks for, as visible
 *     text;
 *   - sign up through AccountKit's form, confirm the address with evig's
 *     6-digit code, sign out, a wrong password refused, sign in;
 *   - the security page: passkeys, two-step sign-in and deletion;
 *   - a seeded account (bcrypt, imported from Auth.js) signing in with its old
 *     password;
 *   - recovery through the mailed link: the old password refused, the new one
 *     accepted; and an email sign-in link signing in.
 *
 * Mail is real mail caught by scripts/ci/mail-sink.cjs (MAIL_SINK). The words
 * are AccountKit's German labels: evig is German unless the visitor picks
 * another language. Synthetic people only.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const run = Date.now().toString(36);
const EMAIL = `journey-${run}@example.test`;
const PASSWORD = `synthetic journey password ${run}`;
const SINK = process.env.MAIL_SINK;
const LEGACY_EMAIL = process.env.LEGACY_EMAIL;
const LEGACY_PASSWORD = process.env.LEGACY_PASSWORD;
const NEW_LEGACY_PASSWORD = `synthetic reset password ${run}`;
const EXPECT = {
  mail: Boolean(SINK),
  orangecat: Boolean(process.env.ORANGECAT_OAUTH_CLIENT_ID),
  signin: Boolean(process.env.SIGNIN_CLIENT_ID),
};

// Each page load from its own (documentation-range) address, so the journey
// never spends one visitor's rate limit.
let hop = 0;
async function visit(page: Page, path: string) {
  hop += 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${hop % 250}` });
  await page.goto(path);
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function sessionEmail(page: Page): Promise<string | null> {
  const session = await (await page.request.get('/api/auth/session')).json();
  return session?.user?.email ?? null;
}

async function signInWithPassword(page: Page, email: string, password: string) {
  await visit(page, '/auth/login');
  await page.locator('input[autocomplete="username webauthn"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await button(page, 'Anmelden').click();
}

async function signOut(page: Page) {
  await visit(page, '/auth/logout');
  await expect.poll(() => sessionEmail(page), { timeout: 30_000 }).toBeNull();
}

/** The newest message to `to` whose text matches `pattern`, from the mail sink. */
async function mailed(to: string, pattern: RegExp): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const lines = (await readFile(SINK!, 'utf8').catch(() => '')).split('\n').filter(Boolean);
    for (const line of lines.reverse()) {
      const mail = JSON.parse(line);
      if (![mail.to].flat().includes(to)) continue;
      const body = String(mail.html ?? '') + ' ' + String(mail.text ?? '');
      const found = body.replaceAll('&amp;', '&').match(pattern);
      if (found) return found[1] ?? found[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`nothing matching ${pattern} was mailed`);
}
const link = (route: string) => new RegExp(`https?://[^"'\\s<>]*${route}[^"'\\s<>]*`);

test('every way into an evig account works on AccountKit screens', async ({ page, browser }) => {
  test.setTimeout(180_000);

  await test.step('the auth pages fit a phone and show no Google-only button', async () => {
    for (const width of [320, 390]) {
      const phone = await browser.newPage({
        viewport: { width, height: 844 },
        storageState: { cookies: [], origins: [] },
      });
      for (const route of ['/auth/login', '/auth/register', '/auth/forgot-password']) {
        await visit(phone, route);
        await phone.waitForLoadState('networkidle');
        const overflow = await phone.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${route} at ${width}px scrolls sideways`).toBeLessThanOrEqual(0);
        await expect(
          phone.getByRole('button', { name: /^(anmelden|weiter) mit google$/i }),
        ).toHaveCount(0);
      }
      await phone.close();
    }
  });

  const offered = async (route: string, labels: Array<[string, boolean]>) => {
    await visit(page, route);
    for (const [name, wanted] of labels) {
      const control = button(page, name);
      if (wanted) await expect(control, `${route} offers "${name}"`).toBeVisible();
      else await expect(control, `${route} hides "${name}"`).toHaveCount(0);
    }
  };

  await test.step('the sign-in page offers every method the env asks for', async () => {
    await offered('/auth/login', [
      ['Anmelden', true],
      ['Mit Passkey anmelden', true],
      ['Stattdessen einen Anmeldelink per E-Mail schicken', EXPECT.mail],
      ['Passwort vergessen?', EXPECT.mail],
      ['Weiter mit OrangeCat', EXPECT.orangecat],
      ['Weiter mit Google, Apple, GitHub, X oder Facebook', EXPECT.signin],
    ]);
  });

  await test.step('the sign-up page offers them too', async () => {
    await offered('/auth/register', [
      ['Konto erstellen', true],
      ['Stattdessen einen Link per E-Mail senden', EXPECT.mail],
      ['Weiter mit OrangeCat', EXPECT.orangecat],
      ['Weiter mit Google, Apple, GitHub, X oder Facebook', EXPECT.signin],
    ]);
  });

  await test.step("sign up, then confirm the address with evig's 6-digit code", async () => {
    await page.locator('input[autocomplete="email"]').fill(EMAIL);
    await page.locator('input[autocomplete="new-password"]').fill(PASSWORD);
    await button(page, 'Konto erstellen').click();
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    expect(await sessionEmail(page)).toBe(EMAIL);
    if (EXPECT.mail) {
      const code = await mailed(EMAIL, /\b(\d{6})\b/);
      await page.locator('input[autocomplete="one-time-code"]').fill(code);
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
      const session = await (await page.request.get('/api/auth/session')).json();
      expect(session?.user?.emailVerified, 'the code confirmed the address').toBe(true);
    }
  });

  await test.step('sign out, a wrong password is refused, the right one signs in', async () => {
    await signOut(page);
    await signInWithPassword(page, EMAIL, 'not the password');
    await expect(page.getByText('E-Mail und Passwort passen nicht zusammen')).toBeVisible();
    expect(await sessionEmail(page)).toBeNull();
    await signInWithPassword(page, EMAIL, PASSWORD);
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    expect(await sessionEmail(page)).toBe(EMAIL);
  });

  await test.step('the security page offers passkeys, two-step sign-in and deletion', async () => {
    await visit(page, '/dashboard/security');
    for (const title of ['Passkeys', 'Anmeldung in zwei Schritten']) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }
    await expect(button(page, 'Mein Konto löschen')).toBeVisible();
    await signOut(page);
  });

  await test.step('an account imported from Auth.js signs in with its old password', async () => {
    expect(
      LEGACY_EMAIL && LEGACY_PASSWORD,
      'LEGACY_EMAIL and LEGACY_PASSWORD are set',
    ).toBeTruthy();
    await signInWithPassword(page, LEGACY_EMAIL!, LEGACY_PASSWORD!);
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30_000 });
    expect(await sessionEmail(page)).toBe(LEGACY_EMAIL);
    await signOut(page);
  });

  if (!EXPECT.mail) return;

  await test.step('recovery through the mailed link sets a new password', async () => {
    await visit(page, '/auth/forgot-password');
    await page.locator('input[autocomplete="email"]').fill(LEGACY_EMAIL!);
    await button(page, 'Link zum Zurücksetzen schicken').click();
    await expect(page.getByText('Falls ein Konto mit dieser Adresse')).toBeVisible();
    await page.goto(await mailed(LEGACY_EMAIL!, link('/api/auth/reset-password/')));
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.locator('input[autocomplete="new-password"]').fill(NEW_LEGACY_PASSWORD);
    expect(page.url(), 'the reset token leaves the address bar').not.toContain('token=');
    await button(page, 'Passwort zurücksetzen').click();
    await expect(page.getByText('Ihr Passwort wurde geändert')).toBeVisible();

    await signInWithPassword(page, LEGACY_EMAIL!, LEGACY_PASSWORD!);
    await expect(page.getByText('E-Mail und Passwort passen nicht zusammen')).toBeVisible();
    await signInWithPassword(page, LEGACY_EMAIL!, NEW_LEGACY_PASSWORD);
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30_000 });
    expect(await sessionEmail(page)).toBe(LEGACY_EMAIL);
    await signOut(page);
  });

  await test.step('an email sign-in link signs in', async () => {
    await visit(page, '/auth/login');
    await page.locator('input[autocomplete="username webauthn"]').fill(EMAIL);
    await button(page, 'Stattdessen einen Anmeldelink per E-Mail schicken').click();
    await expect(page.getByText(`Wir haben einen Link an ${EMAIL} geschickt`)).toBeVisible();
    await page.goto(await mailed(EMAIL, link('/api/auth/magic-link/verify')));
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    expect(await sessionEmail(page)).toBe(EMAIL);
    await signOut(page);
  });

  await test.step('an email sign-in link to a new address creates the evig account', async () => {
    // evig's session is read from its own `users` row, so a person AccountKit
    // created without that row would have no session here.
    const fresh = `link-${run}@example.test`;
    await visit(page, '/auth/login');
    await page.locator('input[autocomplete="username webauthn"]').fill(fresh);
    await button(page, 'Stattdessen einen Anmeldelink per E-Mail schicken').click();
    await expect(page.getByText(`Wir haben einen Link an ${fresh} geschickt`)).toBeVisible();
    await page.goto(await mailed(fresh, link('/api/auth/magic-link/verify')));
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    expect(await sessionEmail(page)).toBe(fresh);
  });
});
