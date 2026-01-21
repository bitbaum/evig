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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getChatHistory, getUserSessions, deleteSession } from '@/lib/hirn'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return NextResponse.json(
        { error: 'No permission to access Hirn' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get history for specific session
      const history = await getChatHistory(sessionId)
      return NextResponse.json({ success: true, data: history })
    } else {
      // Get all sessions for user
      const sessions = await getUserSessions(session.user.id)
      return NextResponse.json({ success: true, data: sessions })
    }
  } catch (error) {
    logger.error('Hirn history error', { error })
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return NextResponse.json(
        { error: 'No permission to access Hirn' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    await deleteSession(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Hirn delete session error', { error })
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
