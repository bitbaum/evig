/**
 * @deprecated Use /api/listings and /api/listings/mine instead.
 * This route requires seller approval. The new P2P marketplace allows any user to list.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { requireSeller } from '@/lib/api/role-checks'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { logger } from '@/lib/logger'

const createProductSchema = z.object({
  images: z.array(z.string().url()).min(1, 'Mindestens ein Bild erforderlich'),
  title: z.string().min(1, 'Titel erforderlich').max(200),
  description: z.string().min(1, 'Beschreibung erforderlich').max(5000),
  condition: z.string().min(1, 'Zustand erforderlich'),
  category: z.string().min(1, 'Kategorie erforderlich'),
  price: z.number().int().positive('Preis muss positiv sein'),
  location: z.string().min(1, 'Standort erforderlich').max(200),
  useAiAnalysis: z.boolean().optional().default(false),
})

interface IdRow {
  id: string
}

export const POST = withAuth(async (request, session) => {
  try {
    // Check if user is a seller
    const sellerError = await requireSeller(session.user.id)
    if (sellerError) {
      return sellerError
    }

    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues.map(i => i.message).join(', '))
    }
    const {
      images,
      title,
      description,
      condition,
      category,
      price: priceCents,
      location,
      useAiAnalysis,
    } = parsed.data

    // Create inventory item
    const inventoryResult = await query(`
      INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
        kivitendo_article_number,
        selling_price_chf,
        quantity_available,
        condition_override,
        assigned_to,
        assignment_notes,
        location
      ) VALUES (
        CONCAT('SELLER-', $1::text, '-', EXTRACT(epoch FROM NOW())::int),
        $2 / 100.0,
        1,
        $3,
        $4,
        'Created via seller dashboard',
        $5
      )
      RETURNING id
    `, [
      session.user.id,
      priceCents,
      condition,
      session.user.id,
      location
    ])

    const inventoryRow = inventoryResult.rows[0] as IdRow
    const inventoryId = inventoryRow.id

    // Create AI extracted product entry (simplified for now)
    const aiProductResult = await query(`
      INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
        original_image_url,
        product_name,
        category,
        condition,
        estimated_price_chf,
        created_by
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5 / 100.0,
        $6
      )
      RETURNING id
    `, [
      images[0], // Use first image as primary
      title,
      category,
      condition,
      priceCents,
      session.user.id
    ])

    const aiProductRow = aiProductResult.rows[0] as IdRow
    const aiProductId = aiProductRow.id

    // Link inventory item to AI product
    await query(
      `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS} SET ai_product_id = $1 WHERE id = $2`,
      [aiProductId, inventoryId]
    )

    // Create product images (batch insert to avoid N+1)
    if (images.length > 0) {
      const values = images.map((_: string, i: number) =>
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
      ).join(', ')
      const params = images.flatMap((url: string, i: number) => [
        aiProductId,
        `seller-image-${i + 1}.jpg`,
        url,
        i === 0, // First image is primary
        session.user.id,
      ])
      await query(`
        INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
          product_id,
          filename,
          file_path,
          is_primary,
          uploaded_by
        ) VALUES ${values}
      `, params)
    }

    // If AI analysis is requested, trigger it (simplified for now)
    if (useAiAnalysis) {
      // Create sustainability score (placeholder)
      await query(`
        INSERT INTO ${TABLE_NAMES.SUSTAINABILITY_SCORES} (
          product_id,
          overall_score,
          environmental_score,
          social_score,
          economic_score,
          assessed_by
        ) VALUES ($1, 75, 70, 80, 75, 'ai')
      `, [aiProductId])

      // Log AI processing
      await query(`
        INSERT INTO ${TABLE_NAMES.AI_PROCESSING_LOGS} (
          product_id,
          request_type,
          provider,
          model,
          confidence_score,
          user_id
        ) VALUES ($1, 'product_analysis', 'seller_input', 'manual', 0.8, $2)
      `, [aiProductId, session.user.id])
    }

    // Create content submission for admin approval (instead of publishing directly)
    await query(`
      INSERT INTO ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} (
        user_id, content_type, title, summary, status,
        content_data, submitted_at, created_at, updated_at
      ) VALUES ($1, 'product', $2, $3, 'pending', $4, NOW(), NOW(), NOW())
    `, [
      session.user.id,
      title,
      description?.substring(0, 200) || '',
      JSON.stringify({ inventoryId, aiProductId, images, category, condition, priceCents })
    ])

    logger.info('Product submitted for approval', {
      inventoryId,
      aiProductId,
      userId: session.user.id,
    })

    return apiSuccess({
      message: 'Produkt erfolgreich eingereicht! Es wird geprüft und nach Freigabe im Shop verfügbar sein.',
      inventoryId,
      aiProductId
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})