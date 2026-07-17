/**
 * Time-off requests — staff self-service.
 * GET  /api/time-off  → my requests
 * POST /api/time-off  → create a new request (status: pending)
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiBadRequest, apiForbidden, apiError } from '@/lib/api/helpers'
import { createTimeOffSchema } from '@/lib/schemas/time-off'
import { createTimeOffRequest, listMyTimeOffRequests } from '@/lib/services/time-off'

export const GET = withAuth(async (_req: NextRequest, session: ValidSession) => {
  try {
    if (!session.user.isStaff) return apiForbidden('Nur für Teammitglieder.')
    const data = await listMyTimeOffRequests(session.user.id)
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, 'Anträge konnten nicht geladen werden.')
  }
})

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    if (!session.user.isStaff) return apiForbidden('Nur für Teammitglieder.')
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiBadRequest('Ungültiger JSON-Body')
    }
    const parsed = createTimeOffSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
    }
    const created = await createTimeOffRequest(session.user.id, parsed.data)
    return apiSuccess(created, 201)
  } catch (error) {
    return apiError(error, 'Antrag konnte nicht erstellt werden.')
  }
})
