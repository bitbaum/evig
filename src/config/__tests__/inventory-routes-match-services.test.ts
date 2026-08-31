/**
 * The E2E inventory smoke must not assert service pages that do not exist.
 *
 * `tests/e2e/helpers/inventory-routes.ts` hand-lists the `/services/*` paths
 * it smoke-tests for a non-404. When #389 retired two services and deleted the
 * `[service]/repair` route, that list kept asserting four dead paths —
 * `/services/hardware-recycling` and three `/services/<slug>/repair` pages.
 *
 * What made it expensive is WHERE that smoke runs: against the LIVE site, not
 * the branch. So it stayed green until the deletion actually deployed, and
 * then turned red on every subsequent PR, for a reason having nothing to do
 * with the PR being reviewed. A dead assertion in a live-site smoke is a trap
 * that springs on whoever comes next.
 *
 * This runs in jest, on the branch, before any of that: every `/services/...`
 * path the smoke expects to be live must correspond to an available entry in
 * SERVICE_CONFIGS. Redirect assertions (which carry a `urlPattern`) are
 * exempt — a retired service keeps its URL alive on purpose.
 */

import { PUBLIC_ROUTES } from '../../../tests/e2e/helpers/inventory-routes';
import { SERVICE_CONFIGS } from '@/app/[locale]/services/data';

describe('E2E inventory service routes match SERVICE_CONFIGS', () => {
  const liveServiceRoutes = PUBLIC_ROUTES.filter(
    (r) => r.path.startsWith('/services/') && !r.urlPattern,
  );

  it('sweeps a non-empty set', () => {
    // A filter that matches nothing would pass the assertion below trivially.
    expect(liveServiceRoutes.length).toBeGreaterThan(1);
    expect(SERVICE_CONFIGS.length).toBeGreaterThan(1);
  });

  it('every smoke-tested service page is an available service', () => {
    const live = new Set(SERVICE_CONFIGS.filter((s) => s.available).map((s) => s.href));
    const orphans = liveServiceRoutes
      .filter((r) => !live.has(r.path))
      .map((r) => `${r.path} is smoke-tested for a non-404 but is not an available service`);
    expect(orphans).toEqual([]);
  });

  it('every available service page is smoke-tested', () => {
    const smoked = new Set(liveServiceRoutes.map((r) => r.path));
    const missing = SERVICE_CONFIGS.filter((s) => s.available && !smoked.has(s.href)).map(
      (s) => `${s.href} is an available service but nothing smoke-tests it`,
    );
    expect(missing).toEqual([]);
  });
});
