/**
 * API: Hirn Documents
 *
 * GET /api/admin/hirn/documents
 * List all indexed documents.
 *
 * DELETE /api/admin/hirn/documents?id=xxx
 * Delete a document and its chunks.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import { listDocuments, deleteDocument, getIngestionStats } from '@/lib/hirn'
import { apiSuccess, apiError, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export const GET = withAdmin('hirn', async (request: NextRequest) => {
  try {
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

    return apiSuccess({
      documents: result.documents,
      total: result.total,
    })
  } catch (error) {
    return apiError(error, 'Dokumente konnten nicht geladen werden')
  }
})

export const DELETE = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
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
})
