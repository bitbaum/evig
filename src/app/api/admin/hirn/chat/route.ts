/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response with RAG context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { chat } from '@/lib/hirn'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check hirn permission
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

    const body = await request.json()
    const { message, sessionId, temperature, maxTokens, topK, minSimilarity } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const response = await chat(message, {
      sessionId,
      userId: session.user.id,
      temperature,
      maxTokens,
      topK,
      minSimilarity,
    })

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        contextUsed: response.contextUsed.map(c => ({
          chunkId: c.chunkId,
          content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
          similarity: c.similarity,
          source: c.document.title || c.document.sourcePath,
        })),
        usage: response.usage,
        model: response.model,
        provider: response.provider,
      },
    })
  } catch (error) {
    logger.error('Hirn chat error', { error })
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
