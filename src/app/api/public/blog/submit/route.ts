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
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

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
    let categoryId = null
    if (data.category) {
      const categoryResult = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE name = $1 OR slug = $1`,
        [data.category]
      )
      categoryId = categoryResult.rows[0]?.id || null
    }

    // Insert submission into database
    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.BLOG_SUBMISSIONS}
       (submitter_name, submitter_email, user_id, title, slug, content,
        submission_type, category_id, category_name, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING id`,
      [
        data.name,
        data.email,
        userId,
        data.title,
        slug,
        data.content,
        data.submissionType,
        categoryId,
        data.category || null,
        data.tags,
      ]
    )

    const submissionId = result.rows[0].id

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
      const adminEmailsResult = await query<{ email: string }>(
        `SELECT email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true AND email IS NOT NULL`
      )
      const adminDashboardUrl = `${APP_URL}/admin/content/submissions`

      for (const admin of adminEmailsResult.rows) {
        await sendEmail(
          admin.email,
          'adminNewBlogSubmission',
          data.name,
          data.email,
          data.title,
          adminDashboardUrl
        )
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
