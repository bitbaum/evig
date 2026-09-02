/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every cron route goes through requireCronAuth, and none re-inlines the check.
 *
 * This is the part that stops it coming back. Fixing six routes fixes six
 * routes; asserting it against the directory fixes the seventh one nobody has
 * written yet — and the seventh will be written by copying the sixth, which is
 * exactly how five of the six ended up failing open in the first place.
 */

const CRON_DIR = join(process.cwd(), 'src', 'app', 'api', 'cron');

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : routeFiles(full);
    }
    return entry === 'route.ts' ? [full] : [];
  });
}

const routes = routeFiles(CRON_DIR);

describe('cron routes are uniformly guarded', () => {
  it('finds the cron routes at all', () => {
    // A path typo would make every assertion below vacuously true.
    expect(routes.length).toBeGreaterThan(3);
  });

  it.each(routes.map((f) => [f.slice(f.indexOf('src/app/api/cron')), f]))(
    '%s calls requireCronAuth',
    (_name, file) => {
      expect(readFileSync(file, 'utf8')).toContain('requireCronAuth');
    },
  );

  it.each(routes.map((f) => [f.slice(f.indexOf('src/app/api/cron')), f]))(
    '%s does not read CRON_SECRET itself',
    (_name, file) => {
      // The shapes that failed open, all of which read the variable directly:
      //   if (cronSecret) { ...check... }
      //   const ok = !cronSecret || headerMatches
      //   if (!cronSecret) return true
      const src = readFileSync(file, 'utf8');
      const code = src
        .split('\n')
        .filter((l) => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('//'))
        .join('\n');
      expect(code).not.toMatch(/process\.env\.CRON_SECRET/);
    },
  );
});
