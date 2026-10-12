/**
 * @vitest-environment node
 *
 * Behaviors locked (the technician directory search, GET /api/technicians?q=):
 *   - name and city match what was typed OR the visible names/cities it could
 *     mean; a town typed without its umlaut finds it ("zurich" → Zürich)
 *   - the description matches as typed
 *   - LIKE wildcards in the typed text are escaped
 */
import { PgDialect } from 'drizzle-orm/pg-core';

const rows = [
  { name: 'Anna Müller', city: 'Zürich' },
  { name: 'Reto Brunner', city: 'Winterthur' },
  { name: 'Céline Favre', city: 'Lausanne' },
];
const where = vi.fn(async () => rows);
const chain = { innerJoin: () => chain, leftJoin: () => chain, where };

vi.mock('@/db', () => ({ db: { select: () => ({ from: () => chain }) } }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { technicianSearchCondition } from '../technician-search';

const params = async (q: string) =>
  new PgDialect().sqlToQuery(await technicianSearchCondition(q)).params;

describe('technicianSearchCondition', () => {
  it('widens a mistyped name with the names it could mean', async () => {
    expect(await params('Brunenr')).toEqual(expect.arrayContaining(['%Brunenr%', '%brunner%']));
  });

  it('finds a town typed without its umlaut, or spelled out', async () => {
    expect(await params('zurich')).toContain('%zürich%');
    expect(await params('Zuerich')).toContain('%zürich%');
  });

  it('matches the description as typed only', async () => {
    const q = new PgDialect().sqlToQuery(await technicianSearchCondition('Winterthr'));
    expect(q.sql).toMatch(/"description" ILIKE \$\d+/);
    expect(q.params.filter((p) => p === '%Winterthr%').length).toBeGreaterThanOrEqual(2);
    expect(q.params).toContain('%winterthur%');
  });

  it('escapes LIKE wildcards', async () => {
    expect(await params('50%')).toContain('%50\\%%');
  });
});
