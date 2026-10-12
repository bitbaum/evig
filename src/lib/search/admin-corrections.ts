/**
 * Typo corrections for the admin ⌘K search (/api/admin/search-index): one
 * cached vocabulary per searched table, so a user's name is corrected only
 * towards user names, a decision title only towards decision titles.
 * Server-only; the words never leave the server — they only widen the ILIKE.
 */
import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { TABLE_NAMES } from '@/config/database';
import { createCorrector } from './corrections';

async function columnTexts(table: string, columns: readonly string[]): Promise<string[]> {
  const result = await db.execute(
    sql`SELECT ${sql.raw(columns.join(', '))} FROM ${sql.raw(table)}`,
  );
  return (result.rows as Record<string, unknown>[]).flatMap((row) =>
    columns.map((c) => (row[c] == null ? '' : String(row[c]))),
  );
}

export const adminCorrectors = {
  users: createCorrector(() => columnTexts(TABLE_NAMES.USERS, ['name', 'email']), {
    name: 'admin-users',
  }),
  decisions: createCorrector(() => columnTexts(TABLE_NAMES.DECISIONS, ['title']), {
    name: 'admin-decisions',
  }),
  listings: createCorrector(() => columnTexts(TABLE_NAMES.LISTINGS, ['title']), {
    name: 'admin-listings',
  }),
};
