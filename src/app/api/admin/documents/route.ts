import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is admin using SSOT helper
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    if (!userResult.rows[0] || !isAdminRole(userResult.rows[0].role)) {
      return apiUnauthorized('Nur Administratoren können diese Funktion verwenden')
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) {
      return apiBadRequest('applicationId Parameter ist erforderlich')
    }

    // Get application details
    const applicationResult = await query(`
      SELECT ra.*, u.name, u.email
      FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra
      JOIN ${TABLE_NAMES.USERS} u ON ra.user_id = u.id
      WHERE ra.id = $1
    `, [applicationId])

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    // Get documents for this application
    const documentsResult = await query(`
      SELECT
        vd.*,
        dt.name as document_type_name,
        dt.description as document_type_description,
        dt.is_required,
        dt.allowed_extensions,
        dt.max_file_size_mb
      FROM ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd
      LEFT JOIN ${TABLE_NAMES.DOCUMENT_TYPES} dt ON vd.document_type_id = dt.id
      WHERE vd.application_id = $1
      ORDER BY dt.is_required DESC, vd.created_at ASC
    `, [applicationId])

    // Get required document types that haven't been uploaded yet
    const requiredTypesResult = await query(`
      SELECT dt.*
      FROM ${TABLE_NAMES.DOCUMENT_TYPES} dt
      WHERE dt.is_required = true
        AND NOT EXISTS (
          SELECT 1 FROM ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd
          WHERE vd.application_id = $1 AND vd.document_type_id = dt.id
        )
    `, [applicationId])

    const documents = documentsResult.rows.map(doc => ({
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

    const missingRequiredDocuments = requiredTypesResult.rows.map(type => ({
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

    return apiSuccess({
      application: {
        id: applicationResult.rows[0].id,
        applicantName: applicationResult.rows[0].name,
        applicantEmail: applicationResult.rows[0].email,
        documentVerificationStatus: applicationResult.rows[0].document_verification_status
      },
      documents,
      missingRequiredDocuments
    })

  } catch (error) {
    logger.error('Error fetching verification documents', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}