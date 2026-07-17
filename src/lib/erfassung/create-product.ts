/**
 * Shared Product Creation Logic
 *
 * SSOT for creating a product in the database.
 * Used by: single erfassung route, bulk-save route
 *
 * Extracted from app/api/admin/erfassung/route.ts to avoid duplication.
 */

import { db } from '@/db'
import { sql, getTableName, eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { PRODUCT_STATUS, MARKETPLACE_STATUS, INVENTORY_ITEM_STATUS } from '@/config/marketplace-status'
import { uploadImage, generateImageFilename } from '@/lib/storage/image-upload'
import { publishRevampitListing } from '@/lib/marketplace/publish-revampit-listing'
import {
  aiExtractedProducts,
  inventoryItems,
  customerProfiles,
  productCustomerProfiles,
  productImages,
} from '@/db/schema/inventory'
import { donations } from '@/db/schema/misc'
import {
  getChecklistForDevice,
  emptyChecklistItemState,
  requiresQualityControl,
  INTAKE_TIERS,
  type ChecklistState,
  type IntakeTier,
} from '@/config/intake-checklist'
import { DONATION_STATUSES } from '@/config/donations'
import type { ErfassungPayload } from '@/types/erfassung'
import type { PoolClient } from 'pg'

export interface CreateProductResult {
  productId: string
  inventoryId: string
  itemUUID: string
  imageUrl: string | null
  donationId: string | null
  /** Marketplace listing id when the product was published immediately. */
  listingId: string | null
  /**
   * True when a requested direct-publish was intercepted by the QC gate:
   * the device category requires the intake checklist, so the item landed
   * in the pipeline (refurbish tier, draft) instead of going live.
   */
  qcRequired: boolean
  /** True only for an explicitly documented direct shop publication without QC. */
  qcBypassed: boolean
}

/**
 * Options for product creation — extends base erfassung with intake-specific features.
 * All fields optional for backward compatibility.
 */
export interface CreateProductOptions {
  /** Source tracking for audit trail */
  source?: 'erfassung' | 'intake' | 'admin' | 'csv_import'
  /** Intake tier — activates checklist initialization */
  intakeTier?: 'refurbish' | 'parts' | 'recycle'
  /** Create a linked donation record */
  donation?: {
    donorName?: string | null
    donorEmail?: string | null
    notes?: string | null
    deviceCategory?: string | null
  }
  /**
   * Link to an existing donations row instead of creating a new one.
   * Mutually exclusive with `donation`; takes precedence when both are set.
   */
  existingDonationId?: string
  /** Forces DRAFT marketplace status, skips marketplace_listings insert */
  checklistGated?: boolean
  /**
   * Explicit staff decision to publish without the RevampIT quality check.
   * Callers must validate and audit the reason; this low-level helper only
   * prevents the automatic QC interception.
   */
  qcBypassReason?: string
}

/** Drizzle db or transaction object — both share insert/select/execute */
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db

/** Check if value is a raw pg PoolClient (has .query but not .insert) */
function isPoolClient(v: unknown): v is PoolClient {
  return v != null && typeof (v as PoolClient).query === 'function' && !('insert' in (v as DbOrTx))
}

/**
 * Generate human-readable Item UUID in format I-YYMMDD-NNNN
 *
 * Accepts either a Drizzle tx/db or a raw PoolClient for backward compatibility
 * with callers that haven't been migrated yet.
 */
export async function generateItemUUID(executor?: DbOrTx | PoolClient): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().slice(2, 10).replace(/-/g, '')

  const tableName = getTableName(aiExtractedProducts)

  let count: string
  if (!executor) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${aiExtractedProducts}
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    count = (result.rows[0] as { count: string })?.count || '0'
  } else if (isPoolClient(executor)) {
    // Legacy PoolClient path (for callers not yet migrated to Drizzle)
    const result = await executor.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE DATE(created_at) = CURRENT_DATE`
    )
    count = result.rows[0]?.count || '0'
  } else {
    const result = await executor.execute(sql`
      SELECT COUNT(*) as count FROM ${aiExtractedProducts}
      WHERE DATE(created_at) = CURRENT_DATE
    `)
    count = (result.rows[0] as { count: string })?.count || '0'
  }

  const seqNum = parseInt(count) + 1
  const seqPart = seqNum.toString().padStart(4, '0')

  return `I-${datePart}-${seqPart}`
}

/**
 * Create a product in the database from an ErfassungPayload.
 *
 * Can be used standalone or within an existing Drizzle transaction.
 */
export async function createErfassungProduct(
  payload: ErfassungPayload,
  userId: string,
  tx: DbOrTx,
  options?: CreateProductOptions,
): Promise<CreateProductResult> {
  // Generate Item UUID within the transaction to prevent race conditions
  const itemUUID = await generateItemUUID(tx)

  // Build dimensions JSON
  const dimensions = {
    laenge_mm: payload.laenge_mm || null,
    breite_mm: payload.breite_mm || null,
    hoehe_mm: payload.hoehe_mm || null,
  }

  // Parse langtext if it's a string
  let specifications = {}
  if (payload.langtext) {
    try {
      specifications = typeof payload.langtext === 'string'
        ? JSON.parse(payload.langtext)
        : payload.langtext
    } catch {
      specifications = { raw: payload.langtext }
    }
  }

  // Determine status based on action (with legacy publish support)
  const action = payload.action || (payload.publish ? 'publish' : 'draft')
  const productStatus = action === 'draft' ? PRODUCT_STATUS.PENDING_REVIEW : PRODUCT_STATUS.APPROVED
  const marketplaceStatus = action === 'publish' ? MARKETPLACE_STATUS.PUBLISHED : MARKETPLACE_STATUS.DRAFT

  const qcBypassed =
    action === 'publish' &&
    Boolean(options?.qcBypassReason?.trim())

  // Default safety gate: a direct publish of a testable device lands in the
  // quality pipeline. The only exception is an explicit, validated and
  // audited "publish untested" decision from the unified intake route.
  const qcRequired =
    action === 'publish' &&
    !options?.checklistGated &&
    !options?.intakeTier &&
    !qcBypassed &&
    requiresQualityControl(payload.hauptkategorie)
  const effectiveTier: IntakeTier | undefined =
    options?.intakeTier ?? (qcRequired ? INTAKE_TIERS.REFURBISH : undefined)

  // 1. Insert into ai_extracted_products
  const [productRow] = await tx
    .insert(aiExtractedProducts)
    .values({
      itemUuid: itemUUID,
      productName: payload.produktname,
      brand: payload.hersteller,
      shortDescription: payload.kurzbeschreibung || null,
      specifications: specifications,
      estimatedPriceChf: String(payload.verkaufspreis),
      condition: payload.zustand || 'good',
      dimensions: dimensions,
      weightGrams: payload.gewicht_kg ? Math.round(payload.gewicht_kg * 1000) : null,
      category: payload.hauptkategorie || null,
      subcategory: payload.unterkategorie || null,
      status: productStatus,
      sourceType: options?.source || 'erfassung',
      createdBy: userId,
    })
    .returning({ id: aiExtractedProducts.id })

  const productId = productRow.id

  // 2. Create donation record if intake with donation, or link to existing
  let donationId: string | null = null
  if (options?.existingDonationId) {
    // Verify the donation actually exists before linking
    const existing = await tx
      .select({ id: donations.id })
      .from(donations)
      .where(eq(donations.id, options.existingDonationId))
      .limit(1)
    if (existing.length > 0) {
      donationId = options.existingDonationId
    }
    // If the ID doesn't resolve, fall through with donationId=null rather than
    // failing the intake — the staff member can re-link later.
  } else if (options?.donation) {
    const [donationRow] = await tx.insert(donations).values({
      donationType: 'device',
      deviceCategory: options.donation.deviceCategory || payload.hauptkategorie || 'other',
      deviceBrand: payload.hersteller,
      deviceModel: payload.produktname,
      deviceDescription: payload.kurzbeschreibung || null,
      deviceCondition: payload.zustand || null,
      donorName: options.donation.donorName || null,
      donorEmail: options.donation.donorEmail || null,
      notes: options.donation.notes || null,
      status: DONATION_STATUSES.RECORDED,
      recordedBy: userId,
    }).returning({ id: donations.id })
    donationId = donationRow.id
  }

  // 3. Initialize intake checklist if a tier applies (explicit or QC-gated)
  let intakeChecklist: ChecklistState | undefined
  if (effectiveTier) {
    const checklistItems = getChecklistForDevice(effectiveTier, payload.hauptkategorie)
    intakeChecklist = {}
    for (const item of checklistItems) {
      intakeChecklist[item.id] = emptyChecklistItemState()
    }
  }

  // 4. Determine final marketplace status (checklist/QC gate overrides publish)
  const finalMarketplaceStatus = options?.checklistGated || qcRequired
    ? MARKETPLACE_STATUS.DRAFT
    : marketplaceStatus

  // 5. Insert into inventory_items
  const [inventoryRow] = await tx
    .insert(inventoryItems)
    .values({
      aiProductId: productId,
      location: payload.location || null,
      storageLocationId: payload.storage_location_id || null,
      boxId: payload.box_id || null,
      quantityAvailable: payload.auf_lager || 1,
      status: INVENTORY_ITEM_STATUS.AVAILABLE,
      sellingPriceChf: String(payload.verkaufspreis),
      marketplaceStatus: finalMarketplaceStatus,
      // Intake-specific fields (null/undefined for non-intake)
      ...(effectiveTier ? {
        intakeTier: effectiveTier,
        intakeChecklist: intakeChecklist,
        checklistComplete: false,
      } : {}),
      sourceDonationId: donationId,
    })
    .returning({ id: inventoryItems.id })

  const inventoryItemId = inventoryRow.id

  // 6. Link customer profiles if provided (batch to avoid N+1)
  if (payload.kundenprofile && payload.kundenprofile.length > 0) {
    const profileRows = await tx
      .select({ id: customerProfiles.id })
      .from(customerProfiles)
      .where(sql`${customerProfiles.slug} IN ${payload.kundenprofile}`)

    if (profileRows.length > 0) {
      await tx
        .insert(productCustomerProfiles)
        .values(
          profileRows.map((r) => ({
            productId: productId,
            profileId: r.id,
            assignedBy: 'manual' as const,
          }))
        )
        .onConflictDoNothing()
    }
  }

  // 7. Handle image upload if provided
  let imageUrl: string | null = null
  if (payload.image) {
    const filename = generateImageFilename(itemUUID)
    const uploadResult = await uploadImage(payload.image, filename, 'products')

    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url

      await tx
        .insert(productImages)
        .values({
          productId: productId,
          filename: filename,
          filePath: uploadResult.url,
          isPrimary: true,
          uploadedBy: userId,
          uploadStatus: 'ready',
        })

      logger.info('Product image uploaded', {
        productId,
        itemUUID,
        imageUrl: uploadResult.url,
      })
    } else {
      logger.warn('Image upload failed, continuing without image', {
        productId,
        itemUUID,
        error: uploadResult.error,
      })
    }
  }

  // 8. Publish to the unified marketplace as a RevampIT listing (replaces the
  // legacy marketplace_listings insert). inventory_items stays the stock record;
  // the listings row is its public, buyable marketplace face. Skipped while the
  // intake checklist gates publication.
  let listingId: string | null = null
  if (action === 'publish' && !options?.checklistGated && !qcRequired) {
    listingId = await publishRevampitListing(tx, inventoryItemId, { verifiedBy: userId })
  }

  return {
    productId,
    inventoryId: inventoryItemId,
    itemUUID,
    imageUrl,
    donationId,
    listingId,
    qcRequired,
    qcBypassed,
  }
}
