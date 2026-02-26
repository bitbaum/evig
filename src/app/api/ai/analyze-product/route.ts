/**
 * API: Image Product Analysis
 *
 * POST /api/ai/analyze-product
 * Analyzes product images using AI vision model.
 *
 * Accepts:
 *   - image: Base64 encoded image data
 *   - imageUrl: URL to image (not yet implemented)
 *   - saveToDatabase: Boolean to save results
 *
 * Returns:
 *   - analysis: Product data extracted from image
 *   - sustainability_score: Environmental scoring
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { auth } from '@/auth'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { extractProductFromImage } from '@/lib/erfassung/ai-extraction'
import { validateBody, AnalyzeProductSchema } from '@/lib/schemas'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { TABLE_NAMES } from '@/config/database'

// Map condition values to display format
const CONDITION_MAP: Record<string, string> = {
  new: 'new',
  like_new: 'excellent',
  good: 'good',
  fair: 'fair',
  poor: 'poor',
}

// Product data interface for sustainability scoring
interface ProductData {
  brand?: string
  category?: string
  material?: string
  specifications?: {
    battery?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// Calculate sustainability score based on product analysis
function calculateSustainabilityScore(productData: ProductData) {
  let score = 50 // Base score
  const factors: Record<string, number> = {}

  // Brand sustainability factors
  const sustainableBrands = ['fairphone', 'shift', 'framework']
  if (
    sustainableBrands.some((brand) =>
      productData.brand?.toLowerCase().includes(brand)
    )
  ) {
    score += 25
    factors.brand_sustainability = 85
  }

  // Product type factors
  if (productData.category === 'Laptops' && productData.brand === 'Apple') {
    score += 10 // Apple has good recycling programs
    factors.recycling_program = 75
  }

  // Material factors
  if (
    productData.material?.toLowerCase().includes('plastic') &&
    !productData.material?.toLowerCase().includes('recycled')
  ) {
    score -= 15
    factors.material_sustainability = 40
  } else if (
    productData.material?.toLowerCase().includes('aluminum') ||
    productData.material?.toLowerCase().includes('titanium')
  ) {
    score += 10
    factors.material_recyclability = 80
  }

  // Energy efficiency
  if (
    productData.specifications?.battery?.includes('up to') ||
    productData.specifications?.battery?.includes('hours')
  ) {
    score += 5
    factors.energy_efficiency = 70
  }

  return {
    overall_score: Math.max(0, Math.min(100, score)),
    environmental_score: Math.max(0, Math.min(100, score - 10)),
    social_score: Math.max(0, Math.min(100, score)),
    economic_score: Math.max(0, Math.min(100, score + 5)),
    factors,
    recommendations: [
      'Consider purchasing refurbished to reduce e-waste',
      'Check for manufacturer take-back programs',
      'Look for energy-efficient certifications',
    ],
    improvement_suggestions: [
      'Opt for products with recycled materials',
      'Choose brands with transparent supply chains',
      'Consider product longevity and repairability',
    ],
    ai_analysis: {
      assessment_method: 'automated_scoring',
      data_sources: ['brand_reputation', 'material_analysis', 'energy_specs'],
      confidence: 0.78,
    },
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validation = validateBody(AnalyzeProductSchema, body)
    if (!validation.success) return validation.error
    const { image, imageUrl, saveToDatabase } = validation.data

    // Get current user from session
    const session = await auth()
    const currentUserId = session?.user?.id

    // Use shared AI extraction service for image analysis
    // Zod refine guarantees at least one of image/imageUrl is present
    const extractionResult = await extractProductFromImage((image || imageUrl)!)

    if (!extractionResult.success) {
      logger.error('Image analysis failed', { error: extractionResult.error })
      return apiError(
        new Error(extractionResult.error),
        extractionResult.error,
        500
      )
    }

    const productData = extractionResult.data
    const processingTime = Date.now() - startTime

    // Convert to analysis result format for compatibility
    const analysisResult = {
      product_name: productData.produktname,
      product_name_confidence: 0.85,
      brand: productData.hersteller,
      brand_confidence: 0.9,
      model: productData.produktname,
      model_confidence: 0.85,
      category: productData.hauptkategorie === '10' ? 'Laptops' : 'Electronics',
      category_confidence: 0.88,
      subcategory:
        productData.unterkategorie === '101'
          ? 'Business Laptops'
          : productData.unterkategorie === '102'
            ? 'Consumer Laptops'
            : productData.unterkategorie === '103'
              ? 'Gaming Laptops'
              : 'Other',
      subcategory_confidence: 0.82,
      estimated_price_chf: parseInt(productData.verkaufspreis) || 0,
      price_confidence: 0.75,
      condition: CONDITION_MAP[productData.zustand] || 'good',
      condition_confidence: 0.8,
      specifications: productData.specs?.reduce(
        (acc, spec) => {
          acc[spec.key.toLowerCase()] = spec.value
          return acc
        },
        {} as Record<string, string>
      ),
      specs_confidence: 0.85,
      color: 'Unknown',
      color_confidence: 0.5,
      material: 'Unknown',
      material_confidence: 0.5,
      dimensions: null,
      weight_grams: null,
      weight_confidence: 0.5,
      ai_provider: 'ollama',
      ai_model: process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision',
      processing_time_ms: processingTime,
      total_confidence: 0.82,
      raw_ai_response: {
        detected_objects: ['electronic_device'],
        primary_object: 'laptop',
        confidence: 0.85,
        analysis_details: productData.kurzbeschreibung,
      },
    }

    let savedProductId = null

    // Save to database if requested
    if (saveToDatabase && currentUserId) {
      try {
        const insertResult = await query<{ id: string }>(
          `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
            original_image_url, extracted_at, product_name, product_name_confidence,
            brand, brand_confidence, model, model_confidence,
            category, category_confidence, subcategory, subcategory_confidence,
            estimated_price_chf, price_confidence, condition, condition_confidence,
            specifications, specs_confidence, color, color_confidence,
            material, material_confidence, dimensions, weight_grams, weight_confidence,
            ai_provider, ai_model, processing_time_ms, total_confidence,
            raw_ai_response, created_by, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
            $26, $27, $28, $29, $30, $31, $32
          ) RETURNING id`,
          [
            imageUrl || null,
            new Date().toISOString(),
            analysisResult.product_name,
            analysisResult.product_name_confidence,
            analysisResult.brand,
            analysisResult.brand_confidence,
            analysisResult.model,
            analysisResult.model_confidence,
            analysisResult.category,
            analysisResult.category_confidence,
            analysisResult.subcategory,
            analysisResult.subcategory_confidence,
            analysisResult.estimated_price_chf,
            analysisResult.price_confidence,
            analysisResult.condition,
            analysisResult.condition_confidence,
            JSON.stringify(analysisResult.specifications),
            analysisResult.specs_confidence,
            analysisResult.color,
            analysisResult.color_confidence,
            analysisResult.material,
            analysisResult.material_confidence,
            analysisResult.dimensions,
            analysisResult.weight_grams,
            analysisResult.weight_confidence,
            analysisResult.ai_provider,
            analysisResult.ai_model,
            analysisResult.processing_time_ms,
            analysisResult.total_confidence,
            JSON.stringify(analysisResult.raw_ai_response),
            currentUserId,
            APPROVAL_STATUS.PENDING,
          ]
        )

        savedProductId = insertResult.rows[0]?.id

        if (savedProductId) {
          // Calculate and save sustainability score
          const sustainabilityScore = calculateSustainabilityScore(analysisResult)
          await query(
            `INSERT INTO ${TABLE_NAMES.SUSTAINABILITY_SCORES} (
              product_id, overall_score, environmental_score, social_score,
              economic_score, factors, recommendations, improvement_suggestions,
              ai_analysis, assessed_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              savedProductId,
              sustainabilityScore.overall_score,
              sustainabilityScore.environmental_score,
              sustainabilityScore.social_score,
              sustainabilityScore.economic_score,
              JSON.stringify(sustainabilityScore.factors),
              JSON.stringify(sustainabilityScore.recommendations),
              JSON.stringify(sustainabilityScore.improvement_suggestions),
              JSON.stringify(sustainabilityScore.ai_analysis),
              'ai',
            ]
          )
        }
      } catch (dbError) {
        // DB save failure should not block the analysis response
        logger.error('Error saving product analysis to DB', { error: dbError })
      }
    }

    // Log AI processing for analytics (non-blocking)
    if (currentUserId) {
      try {
        await query(
          `INSERT INTO ${TABLE_NAMES.AI_PROCESSING_LOGS} (
            request_type, provider, model, input_data, response_data,
            processing_time_ms, confidence_score, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'image_analysis',
            'ollama',
            analysisResult.ai_model,
            JSON.stringify({ image_provided: !!image, image_url_provided: !!imageUrl }),
            JSON.stringify(analysisResult),
            analysisResult.processing_time_ms,
            analysisResult.total_confidence,
            currentUserId,
          ]
        )
      } catch (logError) {
        logger.error('Error logging AI processing', { error: logError })
      }
    }

    logger.info('Image analysis completed', {
      product: analysisResult.product_name,
      processingTime,
    })

    return apiSuccess({
      analysis: analysisResult,
      saved_product_id: savedProductId,
      sustainability_score: calculateSustainabilityScore(analysisResult),
      metadata: {
        saved_to_database: saveToDatabase && !!savedProductId,
        processing_time: analysisResult.processing_time_ms,
        ai_model: analysisResult.ai_model,
      },
    })
  } catch (error) {
    logger.error('Image analysis error', { error })
    return apiError(error, 'Produktbild konnte nicht analysiert werden')
  }
}
