import { NextRequest } from 'next/server';
import { withAdmin } from '@/lib/api/middleware';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { TABLE_NAMES } from '@/config/database';
import { getAdminSections, isSectionId } from '@/config/sections';
import { canAccessSection, toStaffUser } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { adminCorrectors } from '@/lib/search/admin-corrections';
import { allCorrections, containsPattern, ilikeAny } from '@/lib/search/corrections';

/** Rows fetched per table for a query: more than the palette shows, so ranking can choose. */
const SEARCH_CANDIDATES = 25;

export const GET = withAdmin(async (request: NextRequest, session) => {
  try {
    // Scope everything by the CALLER's permissions — the ⌘K index otherwise
    // leaks user PII and sensitive section names to permission-limited staff.
    const staffUser = toStaffUser(session.user);
    const canSeeUsers = canAccessSection(staffUser, 'users');
    const canSeeDecisions = canAccessSection(staffUser, 'decisions');
    const canSeeListings = canAccessSection(staffUser, 'marketplace');

    // With `?q=`, search the FULL tables (ILIKE) rather than just the most
    // recent rows — so old users/listings/decisions are findable, not only
    // whatever happens to be newest. No `q` → recent rows (initial/empty state).
    // The typed text is widened with typo corrections from each table's own
    // words ("Mülller" also asks for "müller"); exact matches sort first, and
    // the palette ranks the candidates (command-bar/build-results).
    const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    const term = containsPattern(q);
    const patterns = async (table: keyof typeof adminCorrectors) =>
      [q, ...allCorrections(await adminCorrectors[table].correct(q))].map(containsPattern);

    const [usersResult, decisionsResult, listingsResult] = await Promise.allSettled([
      canSeeUsers
        ? q
          ? patterns('users').then((p) =>
              db.execute(
                sql`SELECT id, name, email FROM ${sql.raw(TABLE_NAMES.USERS)}
                   WHERE ${ilikeAny(sql`name`, p)} OR ${ilikeAny(sql`email`, p)}
                   ORDER BY (name ILIKE ${term} OR email ILIKE ${term}) DESC, "createdAt" DESC
                   LIMIT ${SEARCH_CANDIDATES}`,
              ),
            )
          : db.execute(
              sql`SELECT id, name, email FROM ${sql.raw(TABLE_NAMES.USERS)}
                   ORDER BY "createdAt" DESC LIMIT 8`,
            )
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
      canSeeDecisions
        ? q
          ? patterns('decisions').then((p) =>
              db.execute(
                sql`SELECT id, title, status FROM ${sql.raw(TABLE_NAMES.DECISIONS)}
                   WHERE ${ilikeAny(sql`title`, p)}
                   ORDER BY (title ILIKE ${term}) DESC, created_at DESC
                   LIMIT ${SEARCH_CANDIDATES}`,
              ),
            )
          : db.execute(
              sql`SELECT id, title, status FROM ${sql.raw(TABLE_NAMES.DECISIONS)}
                   ORDER BY created_at DESC LIMIT 8`,
            )
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
      canSeeListings
        ? q
          ? patterns('listings').then((p) =>
              db.execute(
                sql`SELECT id, title, status FROM ${sql.raw(TABLE_NAMES.LISTINGS)}
                   WHERE ${ilikeAny(sql`title`, p)}
                   ORDER BY (title ILIKE ${term}) DESC, created_at DESC
                   LIMIT ${SEARCH_CANDIDATES}`,
              ),
            )
          : db.execute(
              sql`SELECT id, title, status FROM ${sql.raw(TABLE_NAMES.LISTINGS)}
                   ORDER BY created_at DESC LIMIT 8`,
            )
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
    ]);

    const sections = getAdminSections()
      .filter((s) => isSectionId(s.id) && canAccessSection(staffUser, s.id))
      .map((s) => ({
        id: s.id,
        label: s.ui.label,
        path: s.path,
        description: s.ui.description,
      }));

    type Row = Record<string, unknown>;

    const recentUsers =
      usersResult.status === 'fulfilled'
        ? (usersResult.value.rows as Row[]).map((r) => ({
            id: String(r.id ?? ''),
            name: r.name ? String(r.name) : '',
            email: String(r.email ?? ''),
          }))
        : [];

    const recentDecisions =
      decisionsResult.status === 'fulfilled'
        ? (decisionsResult.value.rows as Row[]).map((r) => ({
            id: String(r.id ?? ''),
            title: String(r.title ?? ''),
            status: String(r.status ?? ''),
          }))
        : [];

    const recentListings =
      listingsResult.status === 'fulfilled'
        ? (listingsResult.value.rows as Row[]).map((r) => ({
            id: String(r.id ?? ''),
            title: String(r.title ?? ''),
            status: String(r.status ?? ''),
          }))
        : [];

    if (usersResult.status === 'rejected') {
      logger.warn('search-index: users query failed', { error: usersResult.reason });
    }
    if (decisionsResult.status === 'rejected') {
      logger.warn('search-index: decisions query failed', { error: decisionsResult.reason });
    }
    if (listingsResult.status === 'rejected') {
      logger.warn('search-index: listings query failed', { error: listingsResult.reason });
    }

    return apiSuccess({ sections, recentUsers, recentDecisions, recentListings });
  } catch (error) {
    logger.error('search-index GET failed', { error });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
});
