/**
 * Tests for the rule-based CSV import analysis
 * (lib/inventory/csv-analysis.ts).
 *
 * Used by the admin bulk-import flow to categorize and condition-tag
 * donated devices before they enter inventory. Every if-branch is a
 * potential mis-categorization surface — a typo in the keyword list
 * silently routes products to the wrong category.
 *
 * Two pure functions:
 *   - analyzeProductDescription: text → {productName, brand, category,
 *     condition, confidence}. Default fallback is "Sonstiges" / "good"
 *     / 0.7 confidence.
 *   - calculateSustainabilityScore: ProductAnalysis → multi-dimensional
 *     score (clamped 0..100) with brand bonus, condition modifier, and
 *     fixed recommendation strings.
 */

import {
  analyzeProductDescription,
  calculateSustainabilityScore,
} from '../csv-analysis'

// ============================================================================
// analyzeProductDescription — category detection
// ============================================================================

describe('analyzeProductDescription — categories', () => {
  it('detects Laptops from "laptop" keyword', () => {
    expect(analyzeProductDescription('Used laptop, good condition', 'Lenovo').category).toBe('Laptops')
  })

  it('detects Laptops from each brand keyword (notebook/macbook/thinkpad/xps)', () => {
    for (const kw of ['notebook', 'macbook', 'thinkpad', 'xps']) {
      const result = analyzeProductDescription(`Refurbished ${kw}`, 'X')
      expect(result.category).toBe('Laptops')
    }
  })

  it('detects Smartphones from iphone/samsung/smartphone/handy/telefon', () => {
    for (const kw of ['iphone', 'samsung', 'smartphone', 'handy', 'telefon']) {
      const result = analyzeProductDescription(`Old ${kw}`, 'Apple')
      expect(result.category).toBe('Smartphones')
    }
  })

  it('detects Monitore from monitor/bildschirm/display', () => {
    for (const kw of ['monitor', 'bildschirm', 'display']) {
      const result = analyzeProductDescription(`24 inch ${kw}`, 'Dell')
      expect(result.category).toBe('Monitore')
    }
  })

  it('detects Computer-Komponenten from RAM keywords (ram/memory/ddr/speicher)', () => {
    for (const kw of ['ram', 'memory', 'ddr', 'speicher']) {
      const result = analyzeProductDescription(`16GB ${kw}`, 'Kingston')
      expect(result.category).toBe('Computer-Komponenten')
    }
  })

  it('detects Computer-Komponenten from storage keywords (ssd/hdd/festplatte/hard drive)', () => {
    for (const kw of ['ssd', 'hdd', 'festplatte', 'hard drive']) {
      const result = analyzeProductDescription(`500GB ${kw}`, 'Samsung')
      expect(result.category).toBe('Computer-Komponenten')
    }
  })

  it('detects Peripheriegeräte from input devices (tastatur/keyboard/maus/mouse)', () => {
    for (const kw of ['tastatur', 'keyboard', 'maus', 'mouse']) {
      const result = analyzeProductDescription(`Wireless ${kw}`, 'Logitech')
      expect(result.category).toBe('Peripheriegeräte')
    }
  })

  it('detects Peripheriegeräte from drucker/printer', () => {
    for (const kw of ['drucker', 'printer']) {
      const result = analyzeProductDescription(`HP ${kw}`, 'HP')
      expect(result.category).toBe('Peripheriegeräte')
    }
  })

  it('falls back to Sonstiges for unrecognized descriptions', () => {
    expect(analyzeProductDescription('Mystery item', 'X').category).toBe('Sonstiges')
  })

  it('matches keywords case-insensitively (description is lowercased internally)', () => {
    expect(analyzeProductDescription('LAPTOP for sale', 'Lenovo').category).toBe('Laptops')
    expect(analyzeProductDescription('IPhone 12', 'Apple').category).toBe('Smartphones')
  })
})

// ============================================================================
// analyzeProductDescription — confidence scoring
// ============================================================================

describe('analyzeProductDescription — confidence', () => {
  it('uses 0.9 for laptop / smartphone matches (highest)', () => {
    expect(analyzeProductDescription('laptop', 'X').confidence).toBe(0.9)
    expect(analyzeProductDescription('smartphone', 'X').confidence).toBe(0.9)
  })

  it('uses 0.85 for monitor matches', () => {
    expect(analyzeProductDescription('monitor 24"', 'X').confidence).toBe(0.85)
  })

  it('uses 0.8 for component / peripheral matches', () => {
    expect(analyzeProductDescription('16GB ram', 'X').confidence).toBe(0.8)
    expect(analyzeProductDescription('mechanical keyboard', 'X').confidence).toBe(0.8)
    expect(analyzeProductDescription('hp printer', 'X').confidence).toBe(0.8)
  })

  it('falls back to 0.7 confidence when no category keyword matches', () => {
    expect(analyzeProductDescription('mysterious item', 'X').confidence).toBe(0.7)
  })
})

// ============================================================================
// analyzeProductDescription — condition detection
// ============================================================================

describe('analyzeProductDescription — condition', () => {
  it('detects new from neu/new/unbenutzt', () => {
    for (const kw of ['neu', 'new', 'unbenutzt']) {
      const result = analyzeProductDescription(`laptop ${kw}`, 'X')
      // Note: 'wie neu' contains 'neu' so to test 'neu' alone we use distinct context
      if (kw === 'neu') continue // covered specifically below
      expect(result.condition).toBe('new')
    }
    expect(analyzeProductDescription('Brand neu Laptop', 'X').condition).toBe('new')
    expect(analyzeProductDescription('Unbenutzt im Karton', 'X').condition).toBe('new')
  })

  it('detects fair from akzeptabel/fair/gebraucht', () => {
    for (const kw of ['akzeptabel', 'fair', 'gebraucht']) {
      const result = analyzeProductDescription(`laptop ${kw}`, 'X')
      expect(result.condition).toBe('fair')
    }
  })

  it('falls back to "good" when no condition keyword matches', () => {
    expect(analyzeProductDescription('laptop', 'X').condition).toBe('good')
  })
})

// ============================================================================
// analyzeProductDescription — output shape
// ============================================================================

describe('analyzeProductDescription — output shape', () => {
  it('passes through the full description as productName', () => {
    const desc = 'Lenovo ThinkPad T480 i5 16GB SSD'
    expect(analyzeProductDescription(desc, 'Lenovo').productName).toBe(desc)
  })

  it('uses the manufacturer as brand when provided', () => {
    expect(analyzeProductDescription('laptop', 'Apple').brand).toBe('Apple')
  })

  it('falls back to "Unknown" brand when manufacturer is empty', () => {
    expect(analyzeProductDescription('laptop', '').brand).toBe('Unknown')
  })
})

// ============================================================================
// calculateSustainabilityScore
// ============================================================================

describe('calculateSustainabilityScore', () => {
  const baseAnalysis = {
    productName: 'X',
    brand: 'OtherBrand',
    category: 'Sonstiges',
    condition: 'good',
    confidence: 0.7,
  }

  it('returns base score of 55 (50 base + 5 good-condition modifier)', () => {
    const result = calculateSustainabilityScore(baseAnalysis)
    expect(result.overall_score).toBe(55)
  })

  it('adds 15 to overall_score for sustainable brands (apple/fairphone/shift/framework/lenovo)', () => {
    for (const brand of ['Apple', 'Fairphone', 'Shift', 'Framework', 'Lenovo']) {
      const result = calculateSustainabilityScore({ ...baseAnalysis, brand })
      expect(result.overall_score).toBeGreaterThanOrEqual(55 + 15)
    }
  })

  it('matches sustainable brands case-insensitively + as substrings', () => {
    expect(calculateSustainabilityScore({ ...baseAnalysis, brand: 'APPLE INC.' }).overall_score)
      .toBeGreaterThanOrEqual(55 + 15)
  })

  it('subtracts 10 from score when condition is "new" (penalizes new gear)', () => {
    const newGear = { ...baseAnalysis, condition: 'new' }
    expect(calculateSustainabilityScore(newGear).overall_score).toBe(50 - 10)
  })

  it('adds 5 for "excellent" condition', () => {
    expect(calculateSustainabilityScore({ ...baseAnalysis, condition: 'excellent' }).overall_score).toBe(55)
  })

  it('clamps overall_score to [0, 100]', () => {
    // Even with all positive modifiers stacked, must not exceed 100
    const max = calculateSustainabilityScore({
      ...baseAnalysis,
      brand: 'Apple', // +15
      category: 'Laptops', // +10 (Apple+Laptops bonus)
      condition: 'excellent', // +5
    })
    expect(max.overall_score).toBeLessThanOrEqual(100)
    expect(max.overall_score).toBeGreaterThanOrEqual(0)
  })

  it('returns four score dimensions (overall + env + social + economic)', () => {
    const result = calculateSustainabilityScore(baseAnalysis)
    expect(result).toHaveProperty('overall_score')
    expect(result).toHaveProperty('environmental_score')
    expect(result).toHaveProperty('social_score')
    expect(result).toHaveProperty('economic_score')
  })

  it('environmental_score is overall - 5 (clamped)', () => {
    const result = calculateSustainabilityScore(baseAnalysis) // overall = 55
    expect(result.environmental_score).toBe(50)
  })

  it('economic_score is overall + 10 (clamped)', () => {
    const result = calculateSustainabilityScore(baseAnalysis) // overall = 55
    expect(result.economic_score).toBe(65)
  })

  it('factors include brand_sustainability + product_recyclability + refurbishment_benefit', () => {
    const result = calculateSustainabilityScore(baseAnalysis)
    expect(result.factors.brand_sustainability).toBeDefined()
    expect(result.factors.product_recyclability).toBeDefined()
    expect(result.factors.refurbishment_benefit).toBeDefined()
  })

  it('refurbishment_benefit is high (80) when condition is not new', () => {
    expect(calculateSustainabilityScore({ ...baseAnalysis, condition: 'good' }).factors.refurbishment_benefit).toBe(80)
  })

  it('refurbishment_benefit drops to 30 for new condition (penalty)', () => {
    expect(calculateSustainabilityScore({ ...baseAnalysis, condition: 'new' }).factors.refurbishment_benefit).toBe(30)
  })

  it('product_recyclability is 70 for Laptops, 50 otherwise', () => {
    expect(calculateSustainabilityScore({ ...baseAnalysis, category: 'Laptops' }).factors.product_recyclability).toBe(70)
    expect(calculateSustainabilityScore({ ...baseAnalysis, category: 'Smartphones' }).factors.product_recyclability).toBe(50)
  })

  it('returns non-empty recommendations + improvement_suggestions arrays', () => {
    const result = calculateSustainabilityScore(baseAnalysis)
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.improvement_suggestions.length).toBeGreaterThan(0)
  })

  it('clamps all scores when input is at the floor', () => {
    // condition=new + non-sustainable brand + 'Sonstiges' should drive scores low
    const lowest = calculateSustainabilityScore({
      ...baseAnalysis,
      brand: 'GenericBrand',
      condition: 'new',
    })
    expect(lowest.overall_score).toBeGreaterThanOrEqual(0)
    expect(lowest.environmental_score).toBeGreaterThanOrEqual(0)
  })
})
