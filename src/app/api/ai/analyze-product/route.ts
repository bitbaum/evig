import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { apiError, apiSuccess, apiBadRequest } from "@/lib/api/helpers";
import { TABLE_NAMES } from "@/config/database";
import { logger } from "@/lib/logger";

// Enhanced AI product database for demonstration
const PRODUCT_DATABASE = [
  {
    patterns: ['iphone', 'apple', 'ios', 'smartphone', 'mobile', 'handy', 'telefon'],
    products: [
      {
        name: 'iPhone 15 Pro Max',
        brand: 'Apple',
        category: 'Smartphones',
        estimatedPrice: { new: 1400, excellent: 1100, good: 850, fair: 600 },
        features: ['Triple-Kamera', 'Titanium Gehäuse', 'A17 Pro Chip', '5G'],
        models: ['15 pro max', '15promax', '15 pro', '15pro', 'a17'],
        keywords: ['apple', 'iphone', 'pro max', 'titanium', 'face id']
      },
      // ... existing products ...
    ]
  },
  // ... existing categories ...
]

// Mock AI service - replace with actual OpenAI/Claude integration
async function analyzeProductImage(imageData: string, imageUrl?: string) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Mock comprehensive analysis result
  const mockAnalysis = {
    product_name: 'MacBook Pro 16" M3',
    product_name_confidence: 0.92,
    brand: 'Apple',
    brand_confidence: 0.98,
    model: 'MacBook Pro 16" M3',
    model_confidence: 0.89,
    category: 'Laptops',
    category_confidence: 0.95,
    subcategory: 'Business Laptops',
    subcategory_confidence: 0.87,
    estimated_price_chf: 2800,
    price_confidence: 0.82,
    condition: 'excellent',
    condition_confidence: 0.91,
    specifications: {
      processor: 'Apple M3 Pro',
      ram: '18GB unified memory',
      storage: '512GB SSD',
      display: '16.2" Liquid Retina XDR',
      battery: 'Up to 22 hours'
    },
    specs_confidence: 0.85,
    color: 'Space Gray',
    color_confidence: 0.94,
    material: 'Aluminum',
    material_confidence: 0.88,
    dimensions: { width: 35.57, height: 1.68, depth: 24.81, unit: 'cm' },
    weight_grams: 2155,
    weight_confidence: 0.76,
    ai_provider: 'openai',
    ai_model: 'gpt-4-vision-preview',
    processing_time_ms: 1850,
    total_confidence: 0.89,
    raw_ai_response: {
      detected_objects: ['laptop', 'computer', 'electronic_device'],
      primary_object: 'laptop',
      confidence: 0.94,
      analysis_details: 'High-end laptop with premium build quality'
    }
  }

  return mockAnalysis
}

// Product data interface for sustainability scoring
interface ProductData {
  brand?: string;
  category?: string;
  material?: string;
  specifications?: {
    battery?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Calculate sustainability score based on product analysis
function calculateSustainabilityScore(productData: ProductData) {
  let score = 50 // Base score
  const factors: Record<string, number> = {}

  // Brand sustainability factors
  const sustainableBrands = ['fairphone', 'shift', 'framework']
  if (sustainableBrands.some(brand => productData.brand?.toLowerCase().includes(brand))) {
    score += 25
    factors.brand_sustainability = 85
  }

  // Product type factors
  if (productData.category === 'Laptops' && productData.brand === 'Apple') {
    score += 10 // Apple has good recycling programs
    factors.recycling_program = 75
  }

  // Material factors
  if (productData.material?.toLowerCase().includes('plastic') && !productData.material?.toLowerCase().includes('recycled')) {
    score -= 15
    factors.material_sustainability = 40
  } else if (productData.material?.toLowerCase().includes('aluminum') || productData.material?.toLowerCase().includes('titanium')) {
    score += 10
    factors.material_recyclability = 80
  }

  // Energy efficiency
  if (productData.specifications?.battery?.includes('up to') || productData.specifications?.battery?.includes('hours')) {
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
      'Look for energy-efficient certifications'
    ],
    improvement_suggestions: [
      'Opt for products with recycled materials',
      'Choose brands with transparent supply chains',
      'Consider product longevity and repairability'
    ],
    ai_analysis: {
      assessment_method: 'automated_scoring',
      data_sources: ['brand_reputation', 'material_analysis', 'energy_specs'],
      confidence: 0.78
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { image, imageUrl, saveToDatabase = false, userId } = await request.json()

    if (!image && !imageUrl) {
      return apiError(
        new Error("Image data or URL required"),
        "Image data or URL required",
        400
      )
    }

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id
    }

    // Analyze product image using AI
    const analysisResult = await analyzeProductImage(image || imageUrl)

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
          status: 'pending_review'
        })
        .select('id')
        .single()

      if (saveError) {
        logger.error('Error saving product analysis', { error: saveError })
      } else {
        savedProductId = savedProduct.id

        // Calculate and save sustainability score
        const sustainabilityScore = calculateSustainabilityScore(analysisResult)
        await supabase
          .from('sustainability_scores')
          .insert({
            product_id: savedProductId,
            overall_score: sustainabilityScore.overall_score,
            environmental_score: sustainabilityScore.environmental_score,
            social_score: sustainabilityScore.social_score,
            economic_score: sustainabilityScore.economic_score,
            factors: sustainabilityScore.factors,
            recommendations: sustainabilityScore.recommendations,
            improvement_suggestions: sustainabilityScore.improvement_suggestions,
            ai_analysis: sustainabilityScore.ai_analysis,
            assessed_by: 'ai'
          })
      }
    }

    // Log AI processing for analytics
    if (currentUserId) {
      await supabase
        .from('ai_processing_logs')
        .insert({
          request_type: 'image_analysis',
          provider: 'openai',
          model: 'gpt-4-vision-preview',
          input_data: { image_provided: !!image, image_url_provided: !!imageUrl },
          response_data: analysisResult,
          processing_time_ms: analysisResult.processing_time_ms,
          confidence_score: analysisResult.total_confidence,
          user_id: currentUserId
        })
    }

    return apiSuccess({
      analysis: analysisResult,
      saved_product_id: savedProductId,
      sustainability_score: calculateSustainabilityScore(analysisResult),
      metadata: {
        saved_to_database: saveToDatabase && !!savedProductId,
        processing_time: analysisResult.processing_time_ms,
        ai_model: analysisResult.ai_model
      }
    })

  } catch (error) {
    return apiError(error, "Failed to analyze product image")
  }
}
