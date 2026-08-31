/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Order completion happens in exactly one place.
 *
 * There were three writers and they disagreed:
 *   confirm-receipt  status + deliveredAt + completedAt + listings SOLD + totalSold++
 *   orders PATCH     status only  → blank OrderStatusTimeline (it reads the timestamps)
 *   Payrexx webhook  status only  → listing stuck RESERVED forever
 *
 * The webhook case is the damaging one: after a successful capture the order
 * read COMPLETED while its listing stayed RESERVED — unbuyable by anyone else,
 * un-relistable by the seller. The CANCELLED branch of that same switch carries
 * a long comment about fixing exactly this lock; the success path never did.
 *
 * A structural test, because the failure mode is a path that FORGETS a step —
 * something no unit test of the paths that remember will ever catch.
 */

const PATHS = {
  webhook: join(process.cwd(), 'src', 'lib', 'services', 'payment-webhook.ts'),
  patch: join(process.cwd(), 'src', 'app', 'api', 'marketplace', 'orders', '[id]', 'route.ts'),
  receipt: join(
    process.cwd(),
    'src',
    'app',
    'api',
    'marketplace',
    'orders',
    '[id]',
    'confirm-receipt',
    'route.ts',
  ),
};

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

describe('marketplace order completion is centralized', () => {
  it.each(Object.entries(PATHS))('%s uses applyOrderCompletion', (_name, path) => {
    expect(read(path)).toMatch(/applyOrderCompletion/);
  });

  it.each(Object.entries(PATHS))('%s does not hand-roll the SOLD write', (_name, path) => {
    const source = read(path);
    // Strip comments: several of these files legitimately DISCUSS the SOLD
    // transition in prose.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');

    // A completion path must not set LISTING_STATUS.SOLD itself; the shared
    // helper owns it, together with the timestamps and the seller counter.
    expect(code).not.toMatch(/status:\s*LISTING_STATUS\.SOLD/);
  });

  it('the helper writes all four effects', () => {
    const helper = read(join(process.cwd(), 'src', 'lib', 'marketplace', 'complete-order.ts'));
    expect(helper).toMatch(/ORDER_STATUS\.COMPLETED/);
    expect(helper).toMatch(/completedAt/);
    expect(helper).toMatch(/deliveredAt/);
    expect(helper).toMatch(/LISTING_STATUS\.SOLD/);
    expect(helper).toMatch(/totalSold/);
  });
});
