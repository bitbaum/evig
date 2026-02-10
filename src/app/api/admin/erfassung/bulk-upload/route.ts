/**
 * API: Bulk File Upload (CSV/Excel)
 *
 * POST /api/admin/erfassung/bulk-upload
 * Accepts a CSV or Excel file upload and returns parsed BulkProduct array.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { parseCSV, parseExcel } from '@/lib/erfassung/file-parser'
import { BULK_LIMITS } from '@/config/erfassung'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung für Produkterfassung')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiBadRequest('Keine Datei hochgeladen')
    }

    // Validate file type
    const allowedTypes = ['.csv', '.tsv', '.txt', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    if (!allowedTypes.some(ext => fileName.endsWith(ext))) {
      return apiBadRequest('Nur CSV-, TSV-, TXT- und Excel-Dateien (.xlsx, .xls) werden unterstützt')
    }

    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    logger.info('Bulk upload started', {
      userId: session.user.id,
      fileName: file.name,
      fileSize: file.size,
      isExcel,
    })

    let products, unmappedColumns

    if (isExcel) {
      const buffer = await file.arrayBuffer()
      if (buffer.byteLength === 0) {
        return apiBadRequest('Datei ist leer')
      }
      ;({ products, unmappedColumns } = await parseExcel(buffer))
    } else {
      const content = await file.text()
      if (!content.trim()) {
        return apiBadRequest('Datei ist leer')
      }
      ;({ products, unmappedColumns } = parseCSV(content))
    }

    if (products.length === 0) {
      return apiBadRequest('Keine Produkte in der Datei gefunden')
    }

    if (products.length > BULK_LIMITS.maxProducts) {
      return apiBadRequest(
        `Datei enthält ${products.length} Produkte. Maximal ${BULK_LIMITS.maxProducts} erlaubt.`
      )
    }

    logger.info('Bulk upload parsed', {
      userId: session.user.id,
      productCount: products.length,
      unmappedColumns,
    })

    return NextResponse.json({
      success: true,
      products,
      unmappedColumns,
    })
  } catch (error) {
    logger.error('Bulk upload error', { error })
    return NextResponse.json(
      { success: false, error: 'Fehler beim Verarbeiten der Datei' },
      { status: 500 }
    )
  }
}
