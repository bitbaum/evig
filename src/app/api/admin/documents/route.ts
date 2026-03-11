import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface DocumentRow {
  id: string
  application_id: string
  document_type_id: string
  document_type_name: string
  document_type_description: string
  is_required: boolean
  filename: string
  original_filename: string
  file_path: string
  file_size_bytes: number
  mime_type: string
  status: string
  admin_notes: string
  reviewed_by: string
  reviewed_at: string
  expires_at: string
  created_at: string
  updated_at: string
}

interface DocumentTypeRow {
  id: string
  slug: string
  name: string
  description: string
  max_file_size_mb: number
  allowed_extensions: string[]
}

interface ApplicationRow {
  id: string
  name: string
  email: string
  document_verification_status: string
}

export const GET = withAdmin('content', async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) {
      return apiBadRequest('applicationId Parameter ist erforderlich')
    }

    // Get application details
    const applicationResult = await db.execute(sql`
      SELECT ra.*, u.name, u.email
      FROM ${sql.raw(TABLE_NAMES.REPAIRER_APPLICATIONS)} ra
      JOIN ${sql.raw(TABLE_NAMES.USERS)} u ON ra.user_id = u.id
      WHERE ra.id = ${applicationId}
    `)

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    // Get documents for this application
    const documentsResult = await db.execute(sql`
      SELECT
        vd.*,
        dt.name as document_type_name,
        dt.description as document_type_description,
        dt.is_required,
        dt.allowed_extensions,
        dt.max_file_size_mb
      FROM ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)} vd
      LEFT JOIN ${sql.raw(TABLE_NAMES.DOCUMENT_TYPES)} dt ON vd.document_type_id = dt.id
      WHERE vd.application_id = ${applicationId}
      ORDER BY dt.is_required DESC, vd.created_at ASC
    `)

    // Get required document types that haven't been uploaded yet
    const requiredTypesResult = await db.execute(sql`
      SELECT dt.*
      FROM ${sql.raw(TABLE_NAMES.DOCUMENT_TYPES)} dt
      WHERE dt.is_required = true
        AND NOT EXISTS (
          SELECT 1 FROM ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)} vd
          WHERE vd.application_id = ${applicationId} AND vd.document_type_id = dt.id
        )
    `)

    const documents = (documentsResult.rows as unknown as DocumentRow[]).map(doc => ({
      id: doc.id,
      applicationId: doc.application_id,
      documentTypeId: doc.document_type_id,
      documentTypeName: doc.document_type_name,
      documentTypeDescription: doc.document_type_description,
      isRequired: doc.is_required,
      filename: doc.filename,
      originalFilename: doc.original_filename,
      filePath: doc.file_path,
      fileSizeBytes: doc.file_size_bytes,
      mimeType: doc.mime_type,
      status: doc.status,
      adminNotes: doc.admin_notes,
      reviewedBy: doc.reviewed_by,
      reviewedAt: doc.reviewed_at,
      expiresAt: doc.expires_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }))

    const missingRequiredDocuments = (requiredTypesResult.rows as unknown as DocumentTypeRow[]).map(type => ({
      id: type.id,
      slug: type.slug,
      name: type.name,
      description: type.description,
      maxFileSizeMb: type.max_file_size_mb,
      allowedExtensions: type.allowed_extensions
    }))

    logger.info('Admin fetched verification documents', {
      adminId: session.user.id,
      applicationId,
      documentCount: documents.length
    })

    const application = applicationResult.rows[0] as unknown as ApplicationRow
    return apiSuccess({
      application: {
        id: application.id,
        applicantName: application.name,
        applicantEmail: application.email,
        documentVerificationStatus: application.document_verification_status
      },
      documents,
      missingRequiredDocuments
    })

  } catch (error) {
    logger.error('Error fetching verification documents', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
