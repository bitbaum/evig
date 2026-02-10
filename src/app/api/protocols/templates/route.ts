/**
 * Protocol Templates API
 *
 * GET /api/protocols/templates - Get meeting type templates
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess } from '@/lib/api/helpers'
import {
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  MEETING_TYPE_TEMPLATES,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICONS,
} from '@/config/protocols'

/**
 * GET /api/protocols/templates
 * Return all meeting type templates with labels and defaults
 */
export const GET = withAdmin(async (_request: NextRequest, _session: ValidSession) => {
  const templates = Object.values(MEETING_TYPES).map(type => ({
    type,
    label: MEETING_TYPE_LABELS[type],
    color: MEETING_TYPE_COLORS[type],
    icon: MEETING_TYPE_ICONS[type],
    ...MEETING_TYPE_TEMPLATES[type],
  }))

  return apiSuccess(templates)
})
