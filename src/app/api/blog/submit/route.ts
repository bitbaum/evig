import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

const submissionsDir = path.join(process.cwd(), 'content/submissions')

// Ensure submissions directory exists
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
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

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to submitter

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
    return apiError(error, 'Failed to fetch submissions')
  }
}
