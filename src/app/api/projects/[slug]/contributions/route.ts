/**
 * POST /api/projects/[slug]/contributions — Visitor offers help on a project.
 *
 * Optionally tied to a specific project_need via need_id. Persists the offer,
 * fires staff-notification + visitor-confirmation emails (fire-and-forget
 * with both `.then(check .success)` AND `.catch()` per the documented swallow
 * pattern in inquiry/route.ts).
 *
 * Public + unauthenticated, rate-limited by IP.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { projects, projectNeeds, projectContributions } from '@/db/schema'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
  apiRateLimited,
} from '@/lib/api/helpers'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { sendCustomEmail } from '@/lib/email'
import {
  projectContributionNotification,
  projectContributionConfirmation,
} from '@/lib/email/templates/projects'
import { CONTACT } from '@/config/org'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

const ContributionSchema = z.object({
  name: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen haben').max(200),
  email: z.string().trim().email('Ungültige E-Mail-Adresse'),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  organization: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Bitte beschreibe dein Angebot in mindestens 10 Zeichen').max(4000),
  needId: z.string().uuid().optional().nullable(),
})

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!rateLimiters.projectContribute(getClientIdentifier(request))) {
      return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED)
    }

    const { slug } = await context.params
    if (!slug) return apiNotFound('Projekt')

    const body = await request.json().catch(() => null)
    if (!body) return apiBadRequest('Ungültige Anfrage')

    const parsed = ContributionSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_INPUT, parsed.error.flatten().fieldErrors)
    }
    const { name, email, phone, organization, message, needId } = parsed.data

    const [project] = await db
      .select({ id: projects.id, slug: projects.slug, isActive: projects.isActive })
      .from(projects)
      .where(eq(projects.slug, slug))

    if (!project || !project.isActive) return apiNotFound('Projekt')

    // Validate need (if provided) belongs to this project
    let needTitle: string | null = null
    if (needId) {
      const [need] = await db
        .select({ id: projectNeeds.id, title: projectNeeds.title })
        .from(projectNeeds)
        .where(and(eq(projectNeeds.id, needId), eq(projectNeeds.projectId, project.id)))
      if (!need) return apiBadRequest('Bedarf nicht gefunden')
      needTitle = need.title
    }

    await db.insert(projectContributions).values({
      projectId: project.id,
      needId: needId ?? null,
      name,
      email,
      phone: phone || null,
      organization: organization || null,
      message,
    })

    logger.info('Project contribution received', { slug, needId, email })

    // Fire-and-forget emails. sendCustomEmail resolves { success: false }
    // on SMTP/Listmonk failure rather than throwing — catch BOTH modes,
    // see inquiry/route.ts for the documented pattern.
    sendCustomEmail(
      CONTACT.email,
      projectContributionNotification(
        project.slug,
        needTitle,
        name,
        email,
        phone || null,
        organization || null,
        message,
      ),
    )
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send project contribution notification (resolved)', { error: r.error, slug })
        }
      })
      .catch(err => logger.warn('Failed to send project contribution notification (rejected)', { error: err, slug }))

    sendCustomEmail(email, projectContributionConfirmation(name, project.slug))
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send project contribution confirmation (resolved)', { error: r.error, email })
        }
      })
      .catch(err => logger.warn('Failed to send project contribution confirmation (rejected)', { error: err, email }))

    return apiSuccess({ message: 'Angebot eingereicht' })
  } catch (error) {
    return apiError(error, 'Fehler beim Senden des Angebots')
  }
}
