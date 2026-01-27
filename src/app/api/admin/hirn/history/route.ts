/**
 * API: Hirn Chat History
 *
 * GET /api/admin/hirn/history?sessionId=xxx
 * Get chat history for a session.
 *
 * GET /api/admin/hirn/history
 * Get all sessions for the current user.
 *
 * DELETE /api/admin/hirn/history?sessionId=xxx
 * Delete a chat session.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getChatHistory, getUserSessions, deleteSession } from '@/lib/hirn'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get history for specific session
      const history = await getChatHistory(sessionId)
      return apiSuccess(history)
    } else {
      // Get all sessions for user
      const sessions = await getUserSessions(session.user.id)
      return apiSuccess(sessions)
    }
  } catch (error) {
    return apiError(error, 'Chat-Verlauf konnte nicht geladen werden')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return apiBadRequest('Session-ID ist erforderlich')
    }

    await deleteSession(sessionId)

    return apiSuccess({ message: 'Session gelöscht' })
  } catch (error) {
    return apiError(error, 'Session konnte nicht gelöscht werden')
  }
}
