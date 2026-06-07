/**
 * IT-Hilfe Notification Service
 *
 * Centralized via @/lib/services/notifications. Every per-user notification
 * (in-app row + email) goes through notifyUsers() — single retry/preference/
 * logging path. The only direct sendCustomEmail() left is the admin shared
 * inbox alert (REVAMPIT_NOTIFICATION_EMAIL targets info@…, not a per-user
 * recipient — notifyUsers/notifyAllStaff don't fit).
 *
 * Closes ARCHITECTURE_DEBT.md #2.
 */

import { db } from '@/db'
import { userSkills } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { eq, and, ne, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { adminNewITHilfeRequest } from '@/lib/email/templates/it-hilfe'
import {
  getCategoryById,
  getUrgencyById,
  getServiceTypeById,
  getSkillById,
  REVAMPIT_NOTIFICATION_EMAIL,
} from '@/config/it-hilfe'
import { APP_URL } from '@/config/urls'

interface NotifyParams {
  requestId: string
  requesterId: string
  requesterName: string
  requesterEmail: string
  title: string
  categoryId: string
  urgency: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  aiDiagnosis: string | null
  /**
   * When true (default), sends the standard request-confirmation
   * notification to the requester. Set to false when the caller is
   * already sending a dedicated email that supersedes the confirmation
   * — e.g. the IT-Hilfe anonymous-post claim flow, where the requester
   * has no active session yet and the standard email's "view your
   * request" link would bounce them to login they can't perform until
   * they claim their account. Admin notification + matching-helper
   * notifications still fire.
   */
  includeRequesterConfirmation?: boolean
}

/**
 * Send all notifications for a newly created IT-Hilfe request.
 * Fire-and-forget: errors are logged but never thrown.
 *
 * - Requester confirmation → notifyUsers (in-app + email via central
 *   getEmailContent dispatch on IT_HILFE_REQUEST_CONFIRMATION)
 * - Admin alert → sendCustomEmail to shared inbox (per-user path doesn't fit)
 * - Helper fan-out → notifyUsers (in-app + email via IT_HILFE_MATCHING_REQUEST)
 */
export function sendRequestCreatedNotifications(params: NotifyParams): void {
  const requestUrl = `${APP_URL}/it-hilfe/${params.requestId}`
  const categoryName = getCategoryById(params.categoryId)?.name || params.categoryId
  const urgencyName = getUrgencyById(params.urgency)?.name || params.urgency
  const serviceTypeName = getServiceTypeById(params.serviceType)?.name || params.serviceType

  // 1. Confirmation to requester (suppressed for new-anonymous accounts
  //    where the dedicated claim email replaces it).
  if (params.includeRequesterConfirmation !== false) {
    notifyUsers([params.requesterId], {
      type: NOTIFICATION_TYPES.IT_HILFE_REQUEST_CONFIRMATION,
      title: `Deine IT-Hilfe Anfrage "${params.title}" wurde erstellt`,
      content: `Wir haben deine Anfrage erhalten. Techniker werden sich bei dir melden.`,
      related_type: RELATED_TYPES.IT_HILFE,
      related_id: params.requestId,
      metadata: {
        requesterName: params.requesterName,
        requestTitle: params.title,
        requestId: params.requestId,
        categoryName,
        ...(params.aiDiagnosis ? { aiDiagnosis: params.aiDiagnosis } : {}),
        requestUrl,
      },
    }).catch(err => {
      logger.warn('Failed to send IT-Hilfe confirmation notification', {
        error: err,
        requestId: params.requestId,
      })
    })
  }

  // 2. Admin notification — shared inbox, not a per-user notification, so
  //    keep using sendCustomEmail. (notifyAllStaff would create per-staff
  //    rows + per-staff emails, a different UX.)
  const adminContent = adminNewITHilfeRequest(
    params.requesterName,
    params.requesterEmail,
    params.title,
    categoryName,
    urgencyName,
    requestUrl,
  )
  sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, adminContent)
    .then(result => {
      if (!result.success) {
        logger.warn('Failed to send IT-Hilfe admin alert (resolved)', {
          error: result.error,
          requestId: params.requestId,
        })
      }
    })
    .catch(err => {
      logger.warn('Failed to send IT-Hilfe admin alert (rejected)', {
        error: err,
        requestId: params.requestId,
      })
    })

  // 3. Matching helper notifications — fan-out via single notifyUsers call.
  if (params.skillsNeeded.length === 0) return

  db
    .select({
      userId: repairerProfiles.userId,
      name: users.name,
      matchingSkills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} = ANY(${params.skillsNeeded}::text[]))`,
    })
    .from(repairerProfiles)
    .innerJoin(users, eq(repairerProfiles.userId, users.id))
    .innerJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
    .where(
      and(
        eq(repairerProfiles.isActive, true),
        // Only verified helpers receive skill-match fan-out. Unverified
        // self-registered profiles must wait for admin approval before
        // they get notified — same rule as the public /api/technicians
        // list endpoint.
        eq(repairerProfiles.isVerified, true),
        eq(repairerProfiles.profileTier, 'community'),
        ne(repairerProfiles.userId, params.requesterId),
        inArray(userSkills.skillId, params.skillsNeeded),
      ),
    )
    .groupBy(repairerProfiles.userId, users.name)
    .then(helpersResult => {
      if (helpersResult.length === 0) return

      // Each helper has different "matching skills" — but notifyUsers
      // sends ONE email content to all recipients. Compromise: send the
      // union of all matched skills in the metadata; each helper's
      // email lists every skill that triggered a match across the
      // pool. Acceptable — helpers see "you match because of [X, Y]"
      // even if only X matched their own profile. Net: simpler, single
      // fan-out, vs N individual sends with per-helper skill lists.
      const allMatchedSkills = Array.from(new Set(
        helpersResult.flatMap(h => h.matchingSkills || []).map(sid => getSkillById(sid)?.name || sid),
      ))
      const helperIds = helpersResult.map(h => h.userId)

      return notifyUsers(helperIds, {
        type: NOTIFICATION_TYPES.IT_HILFE_MATCHING_REQUEST,
        title: `Neue passende Anfrage: ${params.title}`,
        content: `Eine neue IT-Hilfe Anfrage in ${params.canton} passt zu deinen Fähigkeiten.`,
        related_type: RELATED_TYPES.IT_HILFE,
        related_id: params.requestId,
        metadata: {
          helperName: 'Techniker',  // per-user resolution would need a different fan-out shape
          requestTitle: params.title,
          categoryName,
          urgencyName,
          canton: params.canton,
          serviceTypeName,
          matchingSkills: allMatchedSkills.join('|'),
          requestUrl,
        },
      }).then(() => {
        logger.info('Sent IT-Hilfe helper notifications', { requestId: params.requestId, helperCount: helperIds.length })
      })
    })
    .catch(err => {
      logger.warn('Failed to fan-out IT-Hilfe helper notifications', { error: err, requestId: params.requestId })
    })
}

/**
 * Generic IT-Hilfe lifecycle notification — used by routes that need a
 * simple "thing changed" alert without one of the typed templates above.
 * The central pipeline picks the generic notificationEmail() template
 * since no metadata.requestUrl is supplied.
 *
 * Kept as a thin wrapper because the 4 remaining callers (offer
 * decline, request status change, complete, confirm-review) each pass
 * a custom title + content and don't fit one of the typed templates
 * cleanly. Migrating them individually would require a NOTIFICATION_TYPES
 * entry + template per event class — diminishing returns.
 */
export function sendItHilfeNotification(params: {
  recipientIds: string[]
  title: string
  content: string
  requestId: string
}): void {
  notifyUsers(params.recipientIds, {
    type: NOTIFICATION_TYPES.SYSTEM,
    title: params.title,
    content: params.content,
    related_type: RELATED_TYPES.IT_HILFE,
    related_id: params.requestId,
  }).catch(err => {
    logger.warn('Failed to send IT-Hilfe lifecycle notification', { error: err, requestId: params.requestId })
  })
}
