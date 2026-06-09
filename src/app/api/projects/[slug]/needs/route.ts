/**
 * GET /api/projects/[slug]/needs — Public list of open needs for a project.
 *
 * Used by the project detail page (e.g. /projects/upcycling) to render the
 * "what we need" section with per-need "I can help" CTAs.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { projects, projectNeeds } from '@/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { NEED_STATUSES } from '@/config/projects'
import { logger } from '@/lib/logger'
import { pickI18n } from '@/lib/i18n/db-content'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params
    if (!slug) return apiNotFound('Projekt')

    // Resolve visitor locale from the URL prefix (e.g. /ru/projects/upcycling
    // → /ru/api/…) or the NEXT_LOCALE cookie next-intl sets. Falls back to
    // 'de' (the canonical content language) so callers without a locale
    // hint still get well-formed strings.
    const localeFromPath = request.headers.get('x-current-path')?.match(/^\/([a-z]{2})(?:\/|$)/)?.[1]
    const localeFromCookie = request.cookies.get('NEXT_LOCALE')?.value
    const locale = localeFromPath || localeFromCookie || 'de'

    const [project] = await db
      .select({ id: projects.id, isActive: projects.isActive })
      .from(projects)
      .where(eq(projects.slug, slug))

    if (!project || !project.isActive) return apiNotFound('Projekt')

    const rows = await db
      .select({
        id: projectNeeds.id,
        type: projectNeeds.type,
        title: projectNeeds.title,
        description: projectNeeds.description,
        targetQuantity: projectNeeds.targetQuantity,
        targetUnit: projectNeeds.targetUnit,
        status: projectNeeds.status,
        title_i18n: projectNeeds.titleI18n,
        description_i18n: projectNeeds.descriptionI18n,
        target_unit_i18n: projectNeeds.targetUnitI18n,
      })
      .from(projectNeeds)
      .where(and(
        eq(projectNeeds.projectId, project.id),
        eq(projectNeeds.status, NEED_STATUSES.OPEN),
      ))
      .orderBy(asc(projectNeeds.sortOrder))

    // Resolve every translatable field at the API boundary. Clients never
    // see raw JSONB — they get the picked string or the DE canonical.
    const needs = rows.map(n => ({
      id: n.id,
      type: n.type,
      title:       pickI18n(n.title,       n.title_i18n,       locale) ?? n.title,
      description: pickI18n(n.description, n.description_i18n, locale),
      targetQuantity: n.targetQuantity,
      targetUnit:  pickI18n(n.targetUnit,  n.target_unit_i18n, locale),
      status: n.status,
    }))

    return apiSuccess(needs)
  } catch (error) {
    logger.error('Failed to fetch project needs', { error })
    return apiError(error, 'Fehler beim Laden der Projekt-Bedarfe')
  }
}
