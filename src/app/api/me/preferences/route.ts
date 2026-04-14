import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { db } from '@/db'
import { users } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const PreferencesSchema = z.object({
  dashboardMode: z.enum(['coordinator', 'lead', 'volunteer']).optional(),
})

export const PATCH = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const result = PreferencesSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Einstellungen', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { dashboardMode } = result.data

    if (dashboardMode !== undefined) {
      await db
        .update(users)
        .set({ dashboardMode })
        .where(eq(users.id, session.user.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('preferences PATCH failed', { error, userId: session.user.id })
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
})
