/**
 * Authorization boundary — the closed side.
 *
 * This file replaces a stub. The previous version had four tests that between
 * them asserted almost nothing: two had comment-only bodies ("Would need to
 * fill and submit form 6 times"), a third only asserted inside an
 * `if (await el.isVisible())` branch, and every one of them called
 * `test.skip()` when redirected to login — which `/it-hilfe/create` always does
 * when signed out. Wired into CI it would have reported a green "security"
 * check while exercising nothing, which is worse than no check at all.
 *
 * What it asserts now is the property that actually matters and that a gate can
 * genuinely fail on: **a signed-out visitor gets nothing.** Every admin page
 * must redirect rather than render, and every admin/money API must answer 401
 * rather than 200. That is the closed side of the same boundary where a real
 * privilege escalation was found in this codebase (money routes authorizing on
 * a bare staff flag instead of the `finanzen` permission).
 *
 * Deliberately NOT authenticated: this runs with no session, so it needs no
 * seeded users and cannot be skipped for want of credentials. Its whole job is
 * to prove the door is shut.
 */

import { test, expect } from '@playwright/test';
import { ADMIN_BLOCK_CHECK_ROUTES } from './helpers/inventory-routes';

/**
 * Force a genuinely empty session. THIS LINE IS THE TEST.
 *
 * playwright.config.ts sets `storageState` globally, so every context — the
 * `page` AND the `request` fixture — silently inherits a saved login. Without
 * this override these tests ran AUTHENTICATED while claiming to be signed out,
 * and CI proved it: /api/invoices, /api/admin/users and /api/admin/refunds all
 * answered 200. They passed locally only because no saved-session file existed
 * there, which is the worst kind of green — right answer, wrong reason,
 * environment-dependent.
 *
 * A signed-out test that quietly carries a session asserts nothing about the
 * closed side of the boundary. Do not remove this.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Admin/money APIs. A signed-out request must never receive a success body.
 * 405 is acceptable for a POST-only route reached with GET — the request was
 * refused before any handler logic ran.
 */
const PROTECTED_APIS = [
  '/api/invoices',
  '/api/admin/users',
  '/api/admin/refunds',
  '/api/admin/permissions/requests',
  '/api/payments/refund',
];

test.describe('authorization boundary (signed out)', () => {
  test('the route list is non-empty', () => {
    // A sweep over zero routes passes trivially. Fail loudly instead.
    expect(ADMIN_BLOCK_CHECK_ROUTES.length).toBeGreaterThan(5);
    expect(PROTECTED_APIS.length).toBeGreaterThan(3);
  });

  test('no admin page renders to a signed-out visitor', async ({ page }) => {
    // 37 routes in one test. Against a production build each is a fast redirect,
    // but a dev server compiles every route on first visit, which blows through
    // Playwright's 30s default. Budget for the slow case rather than sampling —
    // a sweep that checks half the doors is not a sweep.
    test.setTimeout(240_000);

    const leaked: string[] = [];

    for (const path of ADMIN_BLOCK_CHECK_ROUTES) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      const status = response?.status() ?? 0;
      const landedOn = new URL(page.url()).pathname;

      // Acceptable: bounced to login/home, or refused outright.
      const bounced = !landedOn.startsWith('/admin');
      const refused = status === 401 || status === 403 || status === 404;
      if (!bounced && !refused) leaked.push(`${path} → ${status} (stayed on ${landedOn})`);
    }

    expect(leaked).toEqual([]);
  });

  test('no admin or money API answers 200 to a signed-out request', async ({ request }) => {
    const leaked: string[] = [];

    for (const path of PROTECTED_APIS) {
      const response = await request.get(path, { failOnStatusCode: false });
      const status = response.status();
      // 401/403 = refused. 405 = wrong method on a POST-only route, also refused
      // before any handler logic. Anything 2xx means the door was open.
      if (status < 400) leaked.push(`${path} → ${status}`);
    }

    expect(leaked).toEqual([]);
  });

  test('a refused API response carries no user data', async ({ request }) => {
    // A 401 that still serialises a row is the bug class that shipped a
    // passwordHash inside a page response elsewhere in this fleet. Check the
    // body, not just the status code.
    const response = await request.get('/api/admin/users', { failOnStatusCode: false });
    const body = await response.text();

    expect(response.status()).toBeGreaterThanOrEqual(400);
    for (const secret of ['password_hash', 'passwordHash', 'staff_permissions', '@']) {
      expect(body).not.toContain(secret);
    }
  });
});
