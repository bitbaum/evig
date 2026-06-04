/**
 * IT-Hilfe Notification Service
 *
 * Partially centralized via @/lib/services/notifications — see
 * ARCHITECTURE_DEBT.md #2. accept-offer and offers POST have migrated
 * to notifyUsers(). The request-created flow below still uses
 * sendCustomEmail directly because:
 *
 *   - Requester confirmation: itHilfeRequestConfirmation template isn't
 *     yet wired into getEmailContent — needs a new NOTIFICATION_TYPES
 *     entry (deferred).
 *   - Admin notification: REVAMPIT_NOTIFICATION_EMAIL is a shared inbox
 *     (info@…), not a per-user recipient — stays on sendCustomEmail.
 *   - Helper fan-out: helperNewMatchingRequest template isn't yet wired
 *     into getEmailContent (deferred).
 *
 * sendItHilfeNotification (in-app only) remains for the few callers
 * that have not yet been migrated to notifyUsers().
 */

import { db } from '@/db'
import { userSkills } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { eq, and, ne, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { createInAppNotifications } from '@/lib/api/task-helpers'
import {
  itHilfeRequestConfirmation,
  adminNewITHilfeRequest,
  helperNewMatchingRequest,
} from '@/lib/email/templates/it-hilfe'
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
   * When true (default), sends the standard request-confirmation email
   * to the requester. Set to false when the caller is already sending a
   * dedicated email that supersedes the confirmation — e.g. the IT-Hilfe
   * anonymous-post claim flow, where the requester has no active session
   * yet and the standard email's "view your request" link would bounce
   * them to login they can't perform until they claim their account.
   * Admin notification + matching-helper notifications still fire.
   */
  includeRequesterConfirmation?: boolean
}

/**
 * Send all notifications for a newly created IT-Hilfe request.
 * All sends are fire-and-forget (errors logged but not thrown).
 */
export function sendRequestCreatedNotifications(params: NotifyParams): void {
  const requestUrl = `${APP_URL}/it-hilfe/${params.requestId}`
  const categoryName = getCategoryById(params.categoryId)?.name || params.categoryId
  const urgencyName = getUrgencyById(params.urgency)?.name || params.urgency

  // sendCustomEmail() resolves { success: false } on SMTP / Listmonk
  // failure rather than throwing (src/lib/email/index.ts). A bare .catch()
  // only catches actual rejections, so silent send-failures slip through
  // invisibly. For the IT-Hilfe creation flow this is high-impact: a
  // failed admin notification means the new request sits in the DB with
  // nobody alerted, and a failed helper fan-out means the request never
  // reaches the technicians it was routed to. Inspect each result and
  // log (resolved) failures with the same convention used by the route's
  // own claim-email at /api/it-hilfe/requests/route.ts:317-326 and the
  // 11 prior swallow fixes this thread.

  // 1. Confirmation to requester (suppressed for new-anonymous accounts
  //    where the dedicated claim email replaces it)
  if (params.requesterEmail && params.includeRequesterConfirmation !== false) {
    const requesterEmail = params.requesterEmail
    const content = itHilfeRequestConfirmation(
      params.requesterName,
      params.title,
      params.requestId,
      categoryName,
      params.aiDiagnosis,
      requestUrl
    )
    sendCustomEmail(requesterEmail, content)
      .then(result => {
        if (!result.success) {
          logger.warn('Failed to send IT-Hilfe confirmation email (resolved)', {
            error: result.error,
            requestId: params.requestId,
            email: requesterEmail,
          })
        }
      })
      .catch(err => {
        logger.warn('Failed to send IT-Hilfe confirmation email (rejected)', {
          error: err,
          requestId: params.requestId,
          email: requesterEmail,
        })
      })
  }

  // 2. Admin notification
  const adminContent = adminNewITHilfeRequest(
    params.requesterName,
    params.requesterEmail,
    params.title,
    categoryName,
    urgencyName,
    requestUrl
  )
  sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, adminContent)
    .then(result => {
      if (!result.success) {
        logger.warn('Failed to send IT-Hilfe admin notification (resolved)', {
          error: result.error,
          requestId: params.requestId,
        })
      }
    })
    .catch(err => {
      logger.warn('Failed to send IT-Hilfe admin notification (rejected)', {
        error: err,
        requestId: params.requestId,
      })
    })

  // 3. Matching helper notifications
  const serviceTypeName = getServiceTypeById(params.serviceType)?.name || params.serviceType
  if (params.skillsNeeded.length > 0) {
    // Find active helpers with matching skills (excluding requester)
    db
      .select({
        userId: repairerProfiles.userId,
        name: users.name,
        email: users.email,
        matchingSkills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} = ANY(${params.skillsNeeded}::text[]))`,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .innerJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
      .where(
        and(
          eq(repairerProfiles.isActive, true),
          eq(repairerProfiles.profileTier, 'community'),
          ne(repairerProfiles.userId, params.requesterId),
          inArray(userSkills.skillId, params.skillsNeeded),
        )
      )
      .groupBy(repairerProfiles.userId, users.name, users.email)
      .then(helpersResult => {
        for (const helper of helpersResult) {
          const matchingSkillNames = (helper.matchingSkills || [])
            .map(sid => getSkillById(sid)?.name || sid)
          const helperContent = helperNewMatchingRequest(
            helper.name || 'Techniker',
            params.title,
            categoryName,
            urgencyName,
            params.canton,
            serviceTypeName,
            matchingSkillNames,
            requestUrl
          )
          const helperEmail = helper.email
          sendCustomEmail(helperEmail, helperContent)
            .then(result => {
              if (!result.success) {
                logger.warn('Failed to send IT-Hilfe helper notification (resolved)', {
                  error: result.error,
                  helperEmail,
                  requestId: params.requestId,
                })
              }
            })
            .catch(err => {
              logger.warn('Failed to send IT-Hilfe helper notification (rejected)', {
                error: err,
                helperEmail,
                requestId: params.requestId,
              })
            })
        }
        logger.info('Sent IT-Hilfe helper notifications', { requestId: params.requestId, helperCount: helpersResult.length })
      }).catch(err => {
        logger.warn('Failed to fetch matching helpers for IT-Hilfe notifications', { error: err })
      })
  }
}

/**
 * Send an in-app notification for IT-Hilfe lifecycle events.
 * Fire-and-forget: errors are logged but never thrown.
 */
export function sendItHilfeNotification(params: {
  recipientIds: string[]
  title: string
  content: string
  requestId: string
}): void {
  createInAppNotifications({
    recipientIds: params.recipientIds,
    title: params.title,
    content: params.content,
    relatedType: 'it_hilfe',
    relatedId: params.requestId,
  }).catch(err => {
    logger.warn('Failed to send IT-Hilfe in-app notification', { error: err, requestId: params.requestId })
  })
}
