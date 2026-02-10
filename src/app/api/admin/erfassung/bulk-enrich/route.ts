/**
 * API: Bulk AI Enrichment
 *
 * POST /api/admin/erfassung/bulk-enrich
 * Accepts partial product data (e.g. from CSV) and enriches it with AI-generated
 * specs, descriptions, categories, and price estimates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { validateBody, BulkEnrichSchema } from '@/lib/schemas'
import { extractMultipleProducts } from '@/lib/erfassung/bulk-extraction'
import { BULK_LIMITS } from '@/config/erfassung'

interface EnrichmentItem {
  _tempId: string
  hersteller: string
  produktname: string
  kurzbeschreibung?: string
  hauptkategorie?: string
  zustand?: string
  verkaufspreis?: string
}

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

    const raw = await request.json()
    const validation = validateBody(BulkEnrichSchema, raw)
    if (!validation.success) return validation.error
    const { items } = validation.data

    if (items.length > BULK_LIMITS.maxProducts) {
      return apiBadRequest(`Maximal ${BULK_LIMITS.maxProducts} Produkte pro Vorgang`)
    }

    logger.info('Bulk enrichment started', {
      userId: session.user.id,
      itemCount: items.length,
    })

    // Build text representation of each product for AI extraction
    const textLines = items.map(item => {
      const parts = [item.hersteller, item.produktname]
      if (item.kurzbeschreibung) parts.push(item.kurzbeschreibung)
      if (item.zustand) parts.push(item.zustand)
      if (item.verkaufspreis) parts.push(`${item.verkaufspreis} CHF`)
      return parts.join(' ')
    })

    const text = textLines.join('\n')

    // Use the existing bulk extraction pipeline
    const enrichedProducts = await extractMultipleProducts(text, 'text')

    // Map enriched data back to original tempIds
    const enrichedItems = items.map((item, index) => {
      const enriched = enrichedProducts[index]
      if (!enriched) {
        return { _tempId: item._tempId, enriched: false }
      }

      return {
        _tempId: item._tempId,
        enriched: true,
        data: {
          kurzbeschreibung: enriched.kurzbeschreibung || item.kurzbeschreibung,
          hauptkategorie: enriched.hauptkategorie || item.hauptkategorie,
          unterkategorie: enriched.unterkategorie,
          zustand: enriched.zustand || item.zustand,
          verkaufspreis: enriched.verkaufspreis || item.verkaufspreis,
          specs: enriched.specs,
          kundenprofile: enriched.kundenprofile,
        },
      }
    })

    logger.info('Bulk enrichment complete', {
      userId: session.user.id,
      enrichedCount: enrichedItems.filter(i => i.enriched).length,
    })

    return NextResponse.json({
      success: true,
      items: enrichedItems,
    })
  } catch (error) {
    logger.error('Bulk enrichment error', { error })
    return NextResponse.json(
      { success: false, error: 'Fehler bei der KI-Anreicherung' },
      { status: 500 }
    )
  }
}
