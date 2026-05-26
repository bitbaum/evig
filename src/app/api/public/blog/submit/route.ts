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
import { APPROVAL_STATUS } from '@/config/approval-status'
import { validateBody, BlogSubmissionSchema } from '@/lib/schemas'
import { auth } from '@/auth'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { generateSlug } from '@/lib/utils/slug'
import { db } from '@/db'
import { blogCategories, blogSubmissions, users } from '@/db/schema'
import { eq, or, and, isNotNull } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent submission abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'submission')

    if (!rateLimitResult.allowed) {
      logger.warn('Blog submission rate limit exceeded', { ip: clientIp })
      return apiError(
        null,
        'Zu viele Einreichungen. Bitte versuche es später erneut.',
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
        status: APPROVAL_STATUS.PENDING,
      })
      .returning({ id: blogSubmissions.id })

    const submissionId = inserted.id

    logger.info('Blog submission created', {
      submissionId,
      title: data.title,
      email: data.email,
      type: data.submissionType,
    })

    // Send confirmation email to submitter.
    //
    // sendEmail() resolves { success: false } on SMTP / Listmonk failure
    // rather than throwing (src/lib/email/index.ts:178). The previous
    // try/catch only caught actual rejections, so a silent send-failure
    // logged "Blog submission confirmation email sent" (false positive)
    // and the submitter was left wondering whether anything arrived.
    // Inspect the resolved result; the outer try/catch keeps the
    // (rejected) path for unexpected throws. Same pattern as
    // forgot-password (commit 2ae0e494) and the 9 prior swallow fixes.
    try {
      const sendResult = await sendEmail(
        data.email,
        'blogSubmissionReceived',
        data.name,
        data.title,
        submissionId
      )
      if (sendResult.success) {
        logger.info('Blog submission confirmation email sent', {
          email: data.email,
        })
      } else {
        logger.warn('Failed to send blog submission confirmation email (resolved)', {
          submissionId,
          email: data.email,
          error: sendResult.error,
        })
      }
    } catch (emailError) {
      logger.warn('Failed to send blog submission confirmation email (rejected)', {
        submissionId,
        error: emailError,
      })
    }

    // Send notification email to admins (staff users).
    //
    // Previously the fan-out used `await Promise.allSettled(...)` with no
    // result inspection — every admin email failure (rejected OR resolved
    // { success: false }) was silently dropped. The submission sits in
    // the DB and admins never see the notification ping, so the entry is
    // effectively invisible until someone manually checks
    // /admin/content/submissions. Inspect each settled result and log
    // per-admin failures with the (resolved)/(rejected) convention so an
    // operator can investigate. Mirrors the notifications.ts fix.
    try {
      const adminRows = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.isStaff, true), isNotNull(users.email)))

      const adminDashboardUrl = `${APP_URL}/admin/content/submissions`

      // Fan out in parallel — sequential awaits would add ~200 ms × N
      // admins to the public submitter's response.
      const adminTargets = adminRows.filter((admin): admin is { email: string } =>
        Boolean(admin.email)
      )
      const results = await Promise.allSettled(
        adminTargets.map(admin =>
          sendEmail(
            admin.email,
            'adminNewBlogSubmission',
            data.name,
            data.email,
            data.title,
            adminDashboardUrl
          )
        )
      )
      results.forEach((settled, i) => {
        const adminEmail = adminTargets[i].email
        if (settled.status === 'fulfilled' && !settled.value.success) {
          logger.warn('Failed to send blog submission admin notification (resolved)', {
            submissionId,
            adminEmail,
            error: settled.value.error,
          })
        } else if (settled.status === 'rejected') {
          logger.warn('Failed to send blog submission admin notification (rejected)', {
            submissionId,
            adminEmail,
            error: settled.reason,
          })
        }
      })
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
