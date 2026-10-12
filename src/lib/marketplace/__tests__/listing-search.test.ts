/**
 * @vitest-environment node
 *
 * Behaviors locked (the marketplace search box, GET /api/listings?search=):
 *   - a query whose words all exist is sent to Postgres exactly as before
 *   - a mistyped word ORs in the listing words it could mean; words are ANDed
 *   - the vocabulary is titles/brands/models of active listings
 */
import { PgDialect } from 'drizzle-orm/pg-core';

const rows = [
  { title: 'Lenovo ThinkPad T480', brand: 'Lenovo', model: 'T480' },
  { title: 'MacBook Air 13 Zoll', brand: 'Apple', model: null },
  { title: 'Logitech Tastatur', brand: 'Logitech', model: 'K120' },
];
const where = vi.fn(async () => rows);

vi.mock('@/db', () => ({
  db: { select: () => ({ from: () => ({ where }) }) },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { listingSearchCondition, listingSearchQuery } from '../listing-search';

const dialect = new PgDialect();
const render = (q: ReturnType<typeof listingSearchQuery>) => dialect.sqlToQuery(q);

describe('listingSearchQuery', () => {
  it('keeps the plain query when nothing needed correcting', () => {
    const q = render(
      listingSearchQuery('ThinkPad T480', [
        { word: 'thinkpad', corrections: [] },
        { word: 't480', corrections: [] },
      ]),
    );
    expect(q.sql).toBe("plainto_tsquery('german', $1)");
    expect(q.params).toEqual(['ThinkPad T480']);
  });

  it('ORs each word with its corrections and ANDs the words', () => {
    const q = render(
      listingSearchQuery('Thinkpda T480', [
        { word: 'thinkpda', corrections: ['thinkpad'] },
        { word: 't480', corrections: [] },
      ]),
    );
    expect(q.sql).toBe(
      "(plainto_tsquery('german', $1) || plainto_tsquery('german', $2)) && (plainto_tsquery('german', $3))",
    );
    expect(q.params).toEqual(['thinkpda', 'thinkpad', 't480']);
  });
});

describe('listingSearchCondition', () => {
  it('corrects against the words of active listings', async () => {
    const q = dialect.sqlToQuery(await listingSearchCondition('Mcbook tastatru'));
    expect(q.sql).toContain('to_tsvector');
    expect(q.params).toEqual(expect.arrayContaining(['mcbook', 'macbook', 'tastatru', 'tastatur']));
    expect(where).toHaveBeenCalledTimes(1);
  });

  it('sends an exact query unchanged', async () => {
    const q = dialect.sqlToQuery(await listingSearchCondition('lenovo thinkpad'));
    expect(q.params).toEqual(['lenovo thinkpad']);
  });
});
