import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

    return NextResponse.json(
      {
        success: true,
        message: 'Submission received successfully',
        id: submission.id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
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

    return NextResponse.json({ submissions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
