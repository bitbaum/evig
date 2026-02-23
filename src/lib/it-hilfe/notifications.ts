/**
 * IT-Hilfe Notification Service
 *
 * Sends fire-and-forget emails after request creation:
 * - Confirmation to requester
 * - Notification to RevampIT staff
 * - Notification to matching helpers
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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
    query(`
      SELECT DISTINCT hp.user_id, u.name, u.email,
        ARRAY_AGG(us.skill_id) FILTER (WHERE us.skill_id = ANY($1::text[])) as matching_skills
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} hp
      JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      JOIN ${TABLE_NAMES.USER_SKILLS} us ON hp.user_id = us.user_id
      WHERE hp.is_active = true
        AND hp.user_id != $2
        AND us.skill_id = ANY($1::text[])
      GROUP BY hp.user_id, u.name, u.email
    `, [params.skillsNeeded, params.requesterId]).then(helpersResult => {
      for (const helper of helpersResult.rows as Array<{ user_id: string; name: string; email: string; matching_skills: string[] }>) {
        const matchingSkillNames = (helper.matching_skills || [])
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
      logger.info('Sent IT-Hilfe helper notifications', { requestId: params.requestId, helperCount: helpersResult.rows.length })
    }).catch(err => {
      logger.warn('Failed to fetch matching helpers for IT-Hilfe notifications', { error: err })
    })
  }
}
