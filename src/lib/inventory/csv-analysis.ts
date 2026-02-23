/**
 * CSV Import Analysis Utilities
 *
 * Rule-based product analysis and sustainability scoring for CSV imports.
 * Extracted from the import-csv API route for separation of concerns.
 */

export interface ProductAnalysis {
  productName: string
  brand: string
  category: string
  condition: string
  confidence: number
}

/**
 * Rule-based product analysis for CSV imports
 *
 * Analyzes product description text to determine category, condition,
 * and confidence level without AI.
 */
export function analyzeProductDescription(description: string, manufacturer: string): ProductAnalysis {
  const desc = description.toLowerCase()
  const brand = manufacturer || 'Unknown'

  let category = 'Sonstiges'
  let condition = 'good'
  let confidence = 0.7

  // Category detection rules
  if (desc.includes('laptop') || desc.includes('notebook') || desc.includes('macbook') || desc.includes('thinkpad') || desc.includes('xps')) {
    category = 'Laptops'
    confidence = 0.9
  } else if (desc.includes('iphone') || desc.includes('samsung') || desc.includes('smartphone') || desc.includes('handy') || desc.includes('telefon')) {
    category = 'Smartphones'
    confidence = 0.9
  } else if (desc.includes('monitor') || desc.includes('bildschirm') || desc.includes('display')) {
    category = 'Monitore'
    confidence = 0.85
  } else if (desc.includes('ram') || desc.includes('memory') || desc.includes('ddr') || desc.includes('speicher')) {
    category = 'Computer-Komponenten'
    confidence = 0.8
  } else if (desc.includes('ssd') || desc.includes('hdd') || desc.includes('festplatte') || desc.includes('hard drive')) {
    category = 'Computer-Komponenten'
    confidence = 0.8
  } else if (desc.includes('tastatur') || desc.includes('keyboard') || desc.includes('maus') || desc.includes('mouse')) {
    category = 'Peripheriegeräte'
    confidence = 0.8
  } else if (desc.includes('drucker') || desc.includes('printer')) {
    category = 'Peripheriegeräte'
    confidence = 0.8
  }

  // Condition detection
  if (desc.includes('neu') || desc.includes('new') || desc.includes('unbenutzt')) {
    condition = 'new'
  } else if (desc.includes('wie neu') || desc.includes('excellent') || desc.includes('ausgezeichnet')) {
    condition = 'excellent'
  } else if (desc.includes('gut') || desc.includes('good')) {
    condition = 'good'
  } else if (desc.includes('akzeptabel') || desc.includes('fair') || desc.includes('gebraucht')) {
    condition = 'fair'
  }

  return {
    productName: description,
    brand,
    category,
    condition,
    confidence,
  }
}

/**
 * Calculate sustainability score for imported products
 *
 * Returns scores across environmental, social, and economic dimensions
 * with actionable recommendations.
 */
export function calculateSustainabilityScore(analysis: ProductAnalysis) {
  let score = 50 // Base score

  const sustainableBrands = ['apple', 'fairphone', 'shift', 'framework', 'lenovo']
  const hasSustainableBrand = sustainableBrands.some(brand => analysis.brand?.toLowerCase().includes(brand))

  if (hasSustainableBrand) {
    score += 15
  }

  if (analysis.category === 'Laptops' && analysis.brand === 'Apple') {
    score += 10
  }

  if (analysis.condition === 'new') {
    score -= 10
  } else if (analysis.condition === 'good' || analysis.condition === 'excellent') {
    score += 5
  }

  return {
    overall_score: Math.max(0, Math.min(100, score)),
    environmental_score: Math.max(0, Math.min(100, score - 5)),
    social_score: Math.max(0, Math.min(100, score)),
    economic_score: Math.max(0, Math.min(100, score + 10)),
    factors: {
      brand_sustainability: hasSustainableBrand ? 75 : 40,
      product_recyclability: analysis.category === 'Laptops' ? 70 : 50,
      refurbishment_benefit: analysis.condition !== 'new' ? 80 : 30,
    },
    recommendations: [
      'Consider refurbishing before disposal',
      'Check manufacturer take-back programs',
      'Opt for energy-efficient models',
    ],
    improvement_suggestions: [
      'Choose products from sustainable brands',
      'Consider refurbished options',
      'Look for products with longer warranty periods',
    ],
  }
}
