/**
 * API: Image Product Analysis
 *
 * POST /api/ai/analyze-product
 * Analyzes product images using Ollama vision model.
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
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { extractProductFromImage } from '@/lib/erfassung/ai-extraction'
import { validateBody, AnalyzeProductSchema } from '@/lib/schemas'
import { APPROVAL_STATUS } from '@/config/approval-status'

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
    const supabase = await createClient()
    const body = await request.json()
    const validation = validateBody(AnalyzeProductSchema, body)
    if (!validation.success) return validation.error
    const { image, imageUrl, saveToDatabase, userId } = validation.data

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      currentUserId = user?.id
    }

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
      const { data: savedProduct, error: saveError } = await supabase
        .from('ai_extracted_products')
        .insert({
          original_image_url: imageUrl,
          extracted_at: new Date().toISOString(),
          product_name: analysisResult.product_name,
          product_name_confidence: analysisResult.product_name_confidence,
          brand: analysisResult.brand,
          brand_confidence: analysisResult.brand_confidence,
          model: analysisResult.model,
          model_confidence: analysisResult.model_confidence,
          category: analysisResult.category,
          category_confidence: analysisResult.category_confidence,
          subcategory: analysisResult.subcategory,
          subcategory_confidence: analysisResult.subcategory_confidence,
          estimated_price_chf: analysisResult.estimated_price_chf,
          price_confidence: analysisResult.price_confidence,
          condition: analysisResult.condition,
          condition_confidence: analysisResult.condition_confidence,
          specifications: analysisResult.specifications,
          specs_confidence: analysisResult.specs_confidence,
          color: analysisResult.color,
          color_confidence: analysisResult.color_confidence,
          material: analysisResult.material,
          material_confidence: analysisResult.material_confidence,
          dimensions: analysisResult.dimensions,
          weight_grams: analysisResult.weight_grams,
          weight_confidence: analysisResult.weight_confidence,
          ai_provider: analysisResult.ai_provider,
          ai_model: analysisResult.ai_model,
          processing_time_ms: analysisResult.processing_time_ms,
          total_confidence: analysisResult.total_confidence,
          raw_ai_response: analysisResult.raw_ai_response,
          created_by: currentUserId,
          status: APPROVAL_STATUS.PENDING,
        })
        .select('id')
        .single()

      if (saveError) {
        logger.error('Error saving product analysis', { error: saveError })
      } else {
        savedProductId = savedProduct.id

        // Calculate and save sustainability score
        const sustainabilityScore = calculateSustainabilityScore(analysisResult)
        await supabase.from('sustainability_scores').insert({
          product_id: savedProductId,
          overall_score: sustainabilityScore.overall_score,
          environmental_score: sustainabilityScore.environmental_score,
          social_score: sustainabilityScore.social_score,
          economic_score: sustainabilityScore.economic_score,
          factors: sustainabilityScore.factors,
          recommendations: sustainabilityScore.recommendations,
          improvement_suggestions: sustainabilityScore.improvement_suggestions,
          ai_analysis: sustainabilityScore.ai_analysis,
          assessed_by: 'ai',
        })
      }
    }

    // Log AI processing for analytics
    if (currentUserId) {
      await supabase.from('ai_processing_logs').insert({
        request_type: 'image_analysis',
        provider: 'ollama',
        model: analysisResult.ai_model,
        input_data: { image_provided: !!image, image_url_provided: !!imageUrl },
        response_data: analysisResult,
        processing_time_ms: analysisResult.processing_time_ms,
        confidence_score: analysisResult.total_confidence,
        user_id: currentUserId,
      })
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
