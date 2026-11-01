/**
 * POST /api/account/admin-access/[id]
 * An existing admin confirms or refuses a request.
 * "admin" is full access. "staff" is the everyday team, without finances and users.
 */

import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminAccessRequests, users } from '@/db/schema';
import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiForbidden, apiNotFound, apiSuccess } from '@/lib/api/helpers';
import { NOTIFICATION_TYPES } from '@/config/notifications';
import { DEFAULT_STAFF_PERMISSIONS } from '@/lib/permissions';
import { notifyUsers } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

export const POST = withAuth<{ id: string }>(async (request, session, context) => {
  try {
    if (!session.user.isSuperAdmin) {
      return apiForbidden('Nur ein Admin kann das bestätigen'); // i18n-ok
    }

    const id = context?.params?.id;
    if (!id) return apiBadRequest('Anfrage fehlt'); // i18n-ok

    const body = (await request.json()) as { action?: string; level?: string };
    const action = body.action;
    const level = body.level === 'staff' ? 'staff' : 'admin';
    if (action !== 'approve' && action !== 'reject') {
      return apiBadRequest('Bitte bestätigen oder ablehnen'); // i18n-ok
    }

    const [requestRow] = await db
      .select()
      .from(adminAccessRequests)
      .where(eq(adminAccessRequests.id, id))
      .limit(1);

    if (!requestRow || requestRow.status !== 'pending') {
      return apiNotFound('Anfrage');
    }
    if (requestRow.userId === session.user.id) {
      return apiForbidden('Du kannst deinen eigenen Zugang nicht bestätigen'); // i18n-ok
    }

    if (action === 'approve') {
      await db
        .update(users)
        .set({
          isStaff: true,
          isSuperAdmin: level === 'admin',
          staffPermissions: level === 'admin' ? ['*'] : [...DEFAULT_STAFF_PERMISSIONS],
          tokenVersion: sql`${users.tokenVersion} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, requestRow.userId));
    }

    await db
      .update(adminAccessRequests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        grantLevel: action === 'approve' ? level : null,
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(adminAccessRequests.id, id));

    try {
      await notifyUsers([requestRow.userId], {
        type: NOTIFICATION_TYPES.PERMISSION_REQUEST_REVIEWED,
        title: action === 'approve' ? 'Admin-Zugang bestätigt' : 'Admin-Zugang abgelehnt', // i18n-ok
        content:
          action === 'approve'
            ? 'Dein Zugang ist frei. Melde dich einmal neu an, falls das Menü noch fehlt.' // i18n-ok
            : 'Die Anfrage wurde abgelehnt. Du kannst sie mit einem neuen Grund wieder stellen.', // i18n-ok
        related_type: 'admin_access_request',
        related_id: id,
      });
    } catch (error) {
      logger.warn('Failed to notify the requester about the decision', { error, requestId: id });
    }

    return apiSuccess({ id, status: action === 'approve' ? 'approved' : 'rejected', level });
  } catch (error) {
    return apiError(error, 'Die Anfrage konnte nicht entschieden werden'); // i18n-ok
  }
});
