import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import { isAdminRole } from '@/lib/constants'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/config/urls'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

const submissionsDir = path.join(process.cwd(), 'content/submissions')

// Ensure submissions directory exists
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent submission abuse
    const clientIp = getClientIp(request.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'submission')

    if (!rateLimitResult.allowed) {
      logger.warn('Blog submission rate limit exceeded', { ip: clientIp })
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Einreichungen. Bitte versuchen Sie es später erneut.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      )
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.email || !data.title || !data.content) {
      return apiBadRequest('Missing required fields')
    }

    // Create a unique filename based on timestamp and slug
    const timestamp = new Date().getTime()
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const filename = `${timestamp}-${slug}.json`

    // Create submission object
    const submission = {
      id: timestamp.toString(),
      status: 'pending',
      submissionType: data.submissionType || 'idea',
      name: data.name,
      email: data.email,
      title: data.title,
      category: data.category || '',
      tags: data.tags || [],
      content: data.content,
      submittedAt: data.submittedAt || new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      publishedAt: null,
    }

    // Save to file
    const filepath = path.join(submissionsDir, filename)
    fs.writeFileSync(filepath, JSON.stringify(submission, null, 2))

    // Send confirmation email to submitter
    try {
      await sendEmail(
        data.email,
        'blogSubmissionReceived',
        data.name,
        data.title,
        submission.id
      )
      logger.info('Blog submission confirmation email sent', { email: data.email })
    } catch (emailError) {
      logger.warn('Failed to send blog submission confirmation email', {
        submissionId: submission.id,
        error: emailError
      })
    }

    // Send notification email to admins (staff users)
    try {
      const adminEmailsResult = await query(
        `SELECT email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true AND email IS NOT NULL`,
        []
      )
      const adminDashboardUrl = `${APP_URL}/admin/blog/submissions`

      for (const admin of adminEmailsResult.rows as { email: string }[]) {
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
        submissionId: submission.id,
        error: adminEmailError
      })
    }

    return apiSuccess({
      message: 'Submission received successfully',
      id: submission.id
    })
  } catch (error) {
    return apiError(error, 'Failed to process submission')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication required - only admins can view submissions
    const session = await auth()
    if (!session?.user) {
      return apiUnauthorized('Authentication required')
    }

    // Check admin role
    if (!isAdminRole(session.user.role as string)) {
      return apiUnauthorized('Admin access required')
    }

    // Get all submissions
    const files = fs.readdirSync(submissionsDir)
    const submissions = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(submissionsDir, file)
        const content = fs.readFileSync(filepath, 'utf-8')
        return JSON.parse(content)
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return apiSuccess({ submissions })
  } catch (error) {
    logger.error('Failed to fetch submissions', { error })
    return apiError(error, 'Failed to fetch submissions')
  }
}
