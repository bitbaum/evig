/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Money routes authorize with the `finanzen` permission, never with bare staff.
 *
 * These endpoints are "owner OR finance staff": a user reaches their own
 * invoice or refund, finance staff reach everyone's. They cannot use
 * `withAdmin('finanzen')` — that would lock the owner out — so each one made
 * the decision inline, and every one of them wrote `session.user.isStaff`.
 *
 * That is a *much* wider set than it looks. `finanzen` is `sensitive: true`, so
 * `DEFAULT_STAFF_PERMISSIONS` excludes it: a workshop coordinator or repair tech
 * is `isStaff === true` and therefore passed all ten checks — able to read any
 * user's invoice and PDF, and to refund transactions that were not theirs,
 * while being correctly refused by `/api/admin/refunds` one directory over.
 *
 * Fixing ten call sites fixes ten call sites. Asserting it against the
 * directories fixes the eleventh nobody has written yet — which will be written
 * by copying one of the ten, which is how all ten came to say `isStaff`.
 */

const MONEY_DIRS = [
  join(process.cwd(), 'src', 'app', 'api', 'invoices'),
  join(process.cwd(), 'src', 'app', 'api', 'payments'),
];

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : routeFiles(full);
    }
    return entry === 'route.ts' ? [full] : [];
  });
}

const routes = MONEY_DIRS.flatMap(routeFiles);

describe('money routes never authorize on bare staff status', () => {
  it('finds the money routes (guards against an empty, always-green sweep)', () => {
    expect(routes.length).toBeGreaterThan(5);
  });

  it.each(routes)('%s does not read session.user.isStaff', (file) => {
    const source = readFileSync(file, 'utf8');
    // Strip comments so prose explaining the rule doesn't trip it.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
      .join('\n');

    expect(code).not.toMatch(/session\.user\.isStaff/);
  });

  it.each(routes)('%s imports canAccessFinance when it makes a staff decision', (file) => {
    const source = readFileSync(file, 'utf8');
    // Routes that never branch on staff status need no import; routes that do
    // must use the finance helper.
    const usesFinanceDecision = /isAdmin|canAccessFinance/.test(source);
    if (!usesFinanceDecision) return;
    expect(source).toMatch(/canAccessFinance/);
  });
});
