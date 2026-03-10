/**
 * API: Public Blog Submission
 *
 * POST /api/public/blog/submit - Submit a blog post for review (public, no CSRF)
 *
 * This endpoint is in /api/public/ to bypass CSRF protection for anonymous submissions.
 * Rate limiting is applied to prevent abuse.
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  apiError,
} from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, BlogSubmissionSchema } from '@/lib/schemas'
import { auth } from '@/auth'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { db } from '@/db'
import { blogCategories, blogSubmissions, users } from '@/db/schema'
import { eq, or, and, isNotNull } from 'drizzle-orm'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äàâ]/g, 'a')
    .replace(/[öò]/g, 'o')
    .replace(/[üù]/g, 'u')
    .replace(/[éèêë]/g, 'e')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent submission abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'submission')

    if (!rateLimitResult.allowed) {
      logger.warn('Blog submission rate limit exceeded', { ip: clientIp })
      return apiError(
        null,
        'Zu viele Einreichungen. Bitte versuchen Sie es später erneut.',
        429
      )
    }

    const body = await request.json()
    const validation = validateBody(BlogSubmissionSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    // Check if user is logged in
    const session = await auth()
    const userId = session?.user?.id || null

    // Generate slug
    const slug = generateSlug(data.title)

    // Look up category by name if provided
    let categoryId: string | null = null
    if (data.category) {
      const [category] = await db
        .select({ id: blogCategories.id })
        .from(blogCategories)
        .where(or(
          eq(blogCategories.name, data.category),
          eq(blogCategories.slug, data.category),
        ))
      categoryId = category?.id || null
    }

    // Insert submission into database
    const [inserted] = await db
      .insert(blogSubmissions)
      .values({
        submitterName: data.name,
        submitterEmail: data.email,
        userId,
        title: data.title,
        slug,
        content: data.content,
        submissionType: data.submissionType,
        categoryId,
        categoryName: data.category || null,
        tags: data.tags,
        status: 'pending',
      })
      .returning({ id: blogSubmissions.id })

    const submissionId = inserted.id

    logger.info('Blog submission created', {
      submissionId,
      title: data.title,
      email: data.email,
      type: data.submissionType,
    })

    // Send confirmation email to submitter
    try {
      await sendEmail(
        data.email,
        'blogSubmissionReceived',
        data.name,
        data.title,
        submissionId
      )
      logger.info('Blog submission confirmation email sent', {
        email: data.email,
      })
    } catch (emailError) {
      logger.warn('Failed to send blog submission confirmation email', {
        submissionId,
        error: emailError,
      })
    }

    // Send notification email to admins (staff users)
    try {
      const adminRows = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.isStaff, true), isNotNull(users.email)))

      const adminDashboardUrl = `${APP_URL}/admin/content/submissions`

      for (const admin of adminRows) {
        if (admin.email) {
          await sendEmail(
            admin.email,
            'adminNewBlogSubmission',
            data.name,
            data.email,
            data.title,
            adminDashboardUrl
          )
        }
      }
    } catch (adminEmailError) {
      logger.warn('Failed to send blog submission admin notification', {
        submissionId,
        error: adminEmailError,
      })
    }

    return apiSuccess({
      message: 'Einreichung erfolgreich empfangen',
      id: submissionId,
    })
  } catch (error) {
    logger.error('Failed to process blog submission', { error })
    return apiError(error, 'Fehler bei der Einreichung')
  }
}
