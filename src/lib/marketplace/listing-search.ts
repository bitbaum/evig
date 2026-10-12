/**
 * The marketplace's free-text search condition: Postgres full-text search
 * (German stemming, every word required), forgiving one slip per word.
 *
 * Recall stays Postgres's. What searchkit adds (see lib/search/corrections):
 * for every typed word no active listing contains, the listing words it could
 * mean are OR'd in — "Thinkpda" also asks for "thinkpad", "Mcbook" for
 * "macbook". Listings stay in the order the buyer chose (newest, price,
 * popular); the sort control is the ranking here, so nothing is re-ranked.
 *
 * The vocabulary is titles, brands and models of active listings — the words
 * people search FOR. Descriptions are still searched, but are not a source of
 * corrections: their every word would be a candidate.
 */
import { eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { LISTING_STATUS } from '@/config/marketplace';
import { createCorrector, type CorrectedWord } from '@/lib/search/corrections';

const listingWords = createCorrector(
  async () => {
    const rows = await db
      .select({ title: listings.title, brand: listings.brand, model: listings.model })
      .from(listings)
      .where(eq(listings.status, LISTING_STATUS.ACTIVE));
    return rows.flatMap((row) => [row.title, row.brand, row.model]);
  },
  { name: 'listings' },
);

const listingDocument = sql`to_tsvector('german', coalesce(${listings.title}, '') || ' ' || coalesce(${listings.description}, '') || ' ' || coalesce(${listings.brand}, '') || ' ' || coalesce(${listings.model}, ''))`;

/**
 * The tsquery for `search`: unchanged when no word needed correcting;
 * otherwise each word ORs its corrections and the words are ANDed.
 */
export function listingSearchQuery(search: string, words: readonly CorrectedWord[]): SQL {
  if (words.every((w) => w.corrections.length === 0)) {
    return sql`plainto_tsquery('german', ${search})`;
  }
  const perWord = words.map(
    (w) =>
      sql`(${sql.join(
        [w.word, ...w.corrections].map((term) => sql`plainto_tsquery('german', ${term})`),
        sql` || `,
      )})`,
  );
  return sql.join(perWord, sql` && `);
}

/** WHERE condition for the marketplace search box. */
export async function listingSearchCondition(search: string): Promise<SQL> {
  const words = await listingWords.correct(search);
  return sql`${listingDocument} @@ (${listingSearchQuery(search, words)})`;
}
