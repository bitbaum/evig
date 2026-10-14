/**
 * GET  /api/account/admin-access  — your request, and the queue if you can confirm
 * POST /api/account/admin-access  — ask for admin. An existing admin confirms it.
 */

import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminAccessRequests, users } from '@/db/schema';
import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers';
import { NOTIFICATION_TYPES } from '@/config/notifications';
import { SUPER_ADMIN_EMAILS } from '@/lib/permissions';
import { notifyUsers } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/security/rate-limit';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

export const GET = withAuth(async (_request, session) => {
  try {
    const canReview = session.user.isSuperAdmin;

    const [mine] = await db
      .select({
        id: adminAccessRequests.id,
        status: adminAccessRequests.status,
        reason: adminAccessRequests.reason,
        createdAt: adminAccessRequests.createdAt,
      })
      .from(adminAccessRequests)
      .where(eq(adminAccessRequests.userId, session.user.id))
      .orderBy(desc(adminAccessRequests.createdAt))
      .limit(1);

    const pending = canReview
      ? await db
          .select({
            id: adminAccessRequests.id,
            reason: adminAccessRequests.reason,
            createdAt: adminAccessRequests.createdAt,
            userId: users.id,
            email: users.email,
            name: users.name,
          })
          .from(adminAccessRequests)
          .innerJoin(users, eq(users.id, adminAccessRequests.userId))
          .where(eq(adminAccessRequests.status, 'pending'))
          .orderBy(desc(adminAccessRequests.createdAt))
      : [];

    return apiSuccess({
      mine: mine ?? null,
      canReview,
      pending: pending.map((row) => ({
        id: row.id,
        reason: row.reason,
        createdAt: row.createdAt,
        user: { id: row.userId, email: row.email, name: row.name },
      })),
    });
  } catch (error) {
    return apiError(error, 'Admin-Zugang konnte nicht geladen werden'); // i18n-ok
  }
});

export const POST = withAuth(async (request, session) => {
  try {
    if (session.user.isSuperAdmin) {
      return apiBadRequest('Du hast bereits Admin-Zugang'); // i18n-ok
    }
    if (!session.user.emailVerified) {
      return apiBadRequest('Bitte bestätige zuerst deine E-Mail-Adresse'); // i18n-ok
    }
    if (!rateLimiters.adminAccessRequest(session.user.id)) {
      return apiBadRequest('Zu viele Anfragen. Bitte warte eine Stunde.'); // i18n-ok
    }

    const body = (await request.json()) as { reason?: string };
    const reason = (body.reason ?? '').trim();
    if (reason.length < 8 || reason.length > 500) {
      return apiBadRequest('Schreib kurz, warum du Zugang brauchst (8 bis 500 Zeichen)'); // i18n-ok
    }

    let createdId: string;
    try {
      const [created] = await db
        .insert(adminAccessRequests)
        .values({ userId: session.user.id, reason })
        .returning({ id: adminAccessRequests.id });
      createdId = created.id;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return apiBadRequest('Du hast bereits eine offene Anfrage'); // i18n-ok
      }
      throw error;
    }

    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(
          sql`${users.isSuperAdmin} = true OR lower(${users.email}) = ANY(${[...SUPER_ADMIN_EMAILS]}::text[])`,
        );
      const adminIds = admins.map((admin) => admin.id).filter((id) => id !== session.user.id);
      if (adminIds.length > 0) {
        await notifyUsers(adminIds, {
          type: NOTIFICATION_TYPES.PERMISSION_REQUEST_SUBMITTED,
          title: 'Admin-Zugang angefragt', // i18n-ok
          content: `${session.user.name || session.user.email} möchte Admin-Zugang. Bestätigen kannst du das unter Einstellungen.`, // i18n-ok
          related_type: 'admin_access_request',
          related_id: createdId,
        });
      }
    } catch (error) {
      logger.warn('Failed to notify admins about an access request', {
        error,
        requestId: createdId,
      });
    }

    return apiSuccess({ id: createdId, status: 'pending' });
  } catch (error) {
    return apiError(error, 'Anfrage konnte nicht gespeichert werden'); // i18n-ok
  }
});
