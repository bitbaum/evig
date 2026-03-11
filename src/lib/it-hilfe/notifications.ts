/**
 * IT-Hilfe Notification Service
 *
 * Sends fire-and-forget emails after request creation:
 * - Confirmation to requester
 * - Notification to RevampIT staff
 * - Notification to matching helpers
 */

import { db } from '@/db'
import { helperProfiles, userSkills } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { eq, and, ne, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
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
}

/**
 * Send all notifications for a newly created IT-Hilfe request.
 * All sends are fire-and-forget (errors logged but not thrown).
 */
export function sendRequestCreatedNotifications(params: NotifyParams): void {
  const requestUrl = `${process.env.NEXTAUTH_URL || 'https://revamp-it.ch'}/it-hilfe/${params.requestId}`
  const categoryName = getCategoryById(params.categoryId)?.name || params.categoryId
  const urgencyName = getUrgencyById(params.urgency)?.name || params.urgency

  // 1. Confirmation to requester
  if (params.requesterEmail) {
    const content = itHilfeRequestConfirmation(
      params.requesterName,
      params.title,
      params.requestId,
      categoryName,
      params.aiDiagnosis,
      requestUrl
    )
    sendCustomEmail(params.requesterEmail, content).catch(err => {
      logger.warn('Failed to send IT-Hilfe confirmation email', { error: err, requestId: params.requestId })
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
  sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, adminContent).catch(err => {
    logger.warn('Failed to send IT-Hilfe admin notification', { error: err })
  })

  // 3. Matching helper notifications
  const serviceTypeName = getServiceTypeById(params.serviceType)?.name || params.serviceType
  if (params.skillsNeeded.length > 0) {
    // Find active helpers with matching skills (excluding requester)
    db
      .select({
        userId: helperProfiles.userId,
        name: users.name,
        email: users.email,
        matchingSkills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} = ANY(${params.skillsNeeded}::text[]))`,
      })
      .from(helperProfiles)
      .innerJoin(users, eq(helperProfiles.userId, users.id))
      .innerJoin(userSkills, eq(helperProfiles.userId, userSkills.userId))
      .where(
        and(
          eq(helperProfiles.isActive, true),
          ne(helperProfiles.userId, params.requesterId),
          inArray(userSkills.skillId, params.skillsNeeded),
        )
      )
      .groupBy(helperProfiles.userId, users.name, users.email)
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
          sendCustomEmail(helper.email, helperContent).catch(err => {
            logger.warn('Failed to send IT-Hilfe helper notification', { error: err, helperEmail: helper.email })
          })
        }
        logger.info('Sent IT-Hilfe helper notifications', { requestId: params.requestId, helperCount: helpersResult.length })
      }).catch(err => {
        logger.warn('Failed to fetch matching helpers for IT-Hilfe notifications', { error: err })
      })
  }
}
