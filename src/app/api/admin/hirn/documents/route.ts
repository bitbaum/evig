/**
 * API: Hirn Documents
 *
 * GET /api/admin/hirn/documents
 * List all indexed documents.
 *
 * DELETE /api/admin/hirn/documents?id=xxx
 * Delete a document and its chunks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { listDocuments, deleteDocument, getIngestionStats } from '@/lib/hirn'
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sourceType = searchParams.get('sourceType') || undefined
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getIngestionStats()
      return NextResponse.json({ success: true, data: stats })
    }

    const result = await listDocuments({ limit, offset, sourceType })

    return NextResponse.json({
      success: true,
      data: result.documents,
      total: result.total,
    })
  } catch (error) {
    logger.error('Hirn documents error', { error })
    return NextResponse.json(
      { error: 'Failed to list documents' },
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

    // Only super admins can delete documents
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Only super admins can delete documents' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    await deleteDocument(documentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Hirn delete document error', { error })
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
