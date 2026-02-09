import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { requireSeller } from '@/lib/api/role-checks'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { logger } from '@/lib/logger'

interface IdRow {
  id: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is a seller
    const sellerError = await requireSeller(session.user.id)
    if (sellerError) {
      return sellerError
    }

    const {
      images,
      title,
      description,
      condition,
      category,
      price: priceCents,
      location,
      useAiAnalysis
    } = await request.json()

    // Validate required fields
    if (!images || images.length === 0 || !title || !description || !category || !priceCents || !location) {
      return apiBadRequest(ERROR_MESSAGES.ALL_FIELDS_REQUIRED)
    }

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

    // Create product images
    for (let i = 0; i < images.length; i++) {
      await query(`
        INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
          product_id,
          filename,
          file_path,
          is_primary,
          uploaded_by
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        aiProductId,
        `seller-image-${i + 1}.jpg`,
        images[i],
        i === 0, // First image is primary
        session.user.id
      ])
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
}