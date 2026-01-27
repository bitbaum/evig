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
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sourceType = searchParams.get('sourceType') || undefined
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getIngestionStats()
      return apiSuccess(stats)
    }

    const result = await listDocuments({ limit, offset, sourceType })

    return NextResponse.json({
      success: true,
      data: result.documents,
      total: result.total,
    })
  } catch (error) {
    return apiError(error, 'Dokumente konnten nicht geladen werden')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    // Only super admins can delete documents
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Dokumente löschen')
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return apiBadRequest('Dokument-ID ist erforderlich')
    }

    await deleteDocument(documentId)

    return apiSuccess({ message: 'Dokument gelöscht' })
  } catch (error) {
    return apiError(error, 'Dokument konnte nicht gelöscht werden')
  }
}
