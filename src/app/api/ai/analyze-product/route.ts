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
import { db } from '@/db'
import { aiExtractedProducts, sustainabilityScores, aiProcessingLogs } from '@/db/schema'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { extractProductFromImage } from '@/lib/erfassung/ai-extraction'
import { validateBody, AnalyzeProductSchema } from '@/lib/schemas'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { rateLimiters } from '@/lib/security/rate-limit'

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
    // Auth gate — AI inference is expensive, require login
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Anmeldung erforderlich für Produktanalyse')
    }

    // Rate limit — 5 AI analyses per hour per user
    if (!rateLimiters.aiAnalyze(session.user.id + ':ai-analyze')) {
      return apiError(new Error('Rate limit'), 'Zu viele Anfragen. Bitte versuche es später erneut.', 429)
    }

    const body = await request.json()
    const validation = validateBody(AnalyzeProductSchema, body)
    if (!validation.success) return validation.error
    const { image, imageUrl, saveToDatabase } = validation.data

    const currentUserId = session.user.id

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
        const [inserted] = await db
          .insert(aiExtractedProducts)
          .values({
            originalImageUrl: imageUrl || null,
            productName: analysisResult.product_name,
            productNameConfidence: String(analysisResult.product_name_confidence),
            brand: analysisResult.brand,
            brandConfidence: String(analysisResult.brand_confidence),
            model: analysisResult.model,
            modelConfidence: String(analysisResult.model_confidence),
            category: analysisResult.category,
            categoryConfidence: String(analysisResult.category_confidence),
            subcategory: analysisResult.subcategory,
            subcategoryConfidence: String(analysisResult.subcategory_confidence),
            estimatedPriceChf: String(analysisResult.estimated_price_chf),
            priceConfidence: String(analysisResult.price_confidence),
            condition: analysisResult.condition,
            conditionConfidence: String(analysisResult.condition_confidence),
            specifications: analysisResult.specifications,
            specsConfidence: String(analysisResult.specs_confidence),
            color: analysisResult.color,
            colorConfidence: String(analysisResult.color_confidence),
            material: analysisResult.material,
            materialConfidence: String(analysisResult.material_confidence),
            dimensions: analysisResult.dimensions,
            weightGrams: analysisResult.weight_grams,
            weightConfidence: String(analysisResult.weight_confidence),
            aiProvider: analysisResult.ai_provider,
            aiModel: analysisResult.ai_model,
            processingTimeMs: analysisResult.processing_time_ms,
            totalConfidence: String(analysisResult.total_confidence),
            rawAiResponse: analysisResult.raw_ai_response,
            createdBy: currentUserId,
            status: APPROVAL_STATUS.PENDING,
          })
          .returning({ id: aiExtractedProducts.id })

        savedProductId = inserted?.id

        if (savedProductId) {
          const sustainabilityScore = calculateSustainabilityScore(analysisResult)
          await db
            .insert(sustainabilityScores)
            .values({
              productId: savedProductId,
              overallScore: sustainabilityScore.overall_score,
              environmentalScore: sustainabilityScore.environmental_score,
              socialScore: sustainabilityScore.social_score,
              economicScore: sustainabilityScore.economic_score,
              factors: sustainabilityScore.factors,
              recommendations: sustainabilityScore.recommendations,
              improvementSuggestions: sustainabilityScore.improvement_suggestions,
              aiAnalysis: sustainabilityScore.ai_analysis,
              assessedBy: 'ai',
            })
        }
      } catch (dbError) {
        // DB save failure should not block the analysis response
        logger.error('Error saving product analysis to DB', { error: dbError })
      }
    }

    // Log AI processing for analytics (non-blocking)
    if (currentUserId) {
      try {
        await db
          .insert(aiProcessingLogs)
          .values({
            requestType: 'image_analysis',
            provider: 'ollama',
            model: analysisResult.ai_model,
            inputData: { image_provided: !!image, image_url_provided: !!imageUrl },
            responseData: analysisResult,
            processingTimeMs: analysisResult.processing_time_ms,
            confidenceScore: String(analysisResult.total_confidence),
            userId: currentUserId,
          })
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
