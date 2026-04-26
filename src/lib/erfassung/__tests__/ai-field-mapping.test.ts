/**
 * Tests for AI field-mapping helpers
 * (lib/erfassung/ai-field-mapping.ts).
 *
 * Two pure functions used after AI extraction (voice/text/image):
 *
 *   generateVerificationSources(data)
 *     - Per-field URLs for human verification: manufacturer support
 *       page (only for known vendors), Swiss marketplaces (always),
 *       tech review sites (always)
 *     - Returns { fieldSources, allSources }
 *
 *   calculateFieldConfidence(inputText, data, sourceType, model)
 *     - Per-field confidence + verification-source attachment
 *     - "Explicit mention" detection (substring match, case-insensitive,
 *       words ≥3 chars only — to avoid false positives on connectives)
 *     - Domain-specific bumps for spec keywords / price pattern /
 *       condition keywords
 */

import {
  generateVerificationSources,
  calculateFieldConfidence,
} from '../ai-field-mapping'
import type { VoiceProductData } from '@/types/erfassung'

const baseData: VoiceProductData = {
  hersteller: '',
  produktname: '',
  kurzbeschreibung: '',
  specs: [],
  verkaufspreis: '',
  zustand: '',
  hauptkategorie: '',
  unterkategorie: '',
  kundenprofile: [],
}

// ============================================================================
// generateVerificationSources
// ============================================================================

describe('generateVerificationSources — manufacturer source', () => {
  it('adds an Apple support source when hersteller is "Apple"', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Apple',
      produktname: 'MacBook Pro',
    })
    expect(fieldSources.hersteller).toHaveLength(1)
    expect(fieldSources.hersteller[0].type).toBe('manufacturer')
    expect(fieldSources.hersteller[0].url).toContain('support.apple.com')
    expect(fieldSources.hersteller[0].url).toContain('MacBook%20Pro')
    expect(fieldSources.hersteller[0].relevance).toBe(0.95)
  })

  it('matches manufacturer keys case-insensitively', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'LENOVO',
      produktname: 'ThinkPad',
    })
    expect(fieldSources.hersteller[0].url).toContain('lenovo.com')
  })

  it('attaches the manufacturer source to hersteller, produktname, AND specs', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Dell',
      produktname: 'XPS 13',
    })
    expect(fieldSources.hersteller).toBeDefined()
    expect(fieldSources.produktname).toBeDefined()
    expect(fieldSources.specs).toBeDefined()
  })

  it('skips the manufacturer source for unknown vendors', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'NoNameBrand',
      produktname: 'X',
    })
    expect(fieldSources.hersteller).toBeUndefined()
  })

  it('skips the manufacturer source when produktname is empty (no useful URL to build)', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Apple',
      produktname: '',
    })
    expect(fieldSources.hersteller).toBeUndefined()
  })

  it('covers all 7 documented manufacturer keys', () => {
    for (const brand of ['apple', 'dell', 'lenovo', 'hp', 'microsoft', 'asus', 'acer']) {
      const { fieldSources } = generateVerificationSources({
        ...baseData,
        hersteller: brand,
        produktname: 'X',
      })
      expect(fieldSources.hersteller).toBeDefined()
      expect(fieldSources.hersteller).toHaveLength(1)
    }
  })
})

describe('generateVerificationSources — Swiss marketplaces', () => {
  it('always adds 3 marketplace sources for verkaufspreis (Ricardo/tutti/Revendo)', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'X',
      produktname: 'Y',
    })
    expect(fieldSources.verkaufspreis).toHaveLength(3)
    const names = fieldSources.verkaufspreis.map(s => s.title)
    expect(names).toContain('Ricardo.ch')
    expect(names).toContain('tutti.ch')
    expect(names).toContain('Revendo.ch')
  })

  it('marks marketplace sources with type=marketplace and relevance 0.85', () => {
    const { fieldSources } = generateVerificationSources(baseData)
    for (const source of fieldSources.verkaufspreis) {
      expect(source.type).toBe('marketplace')
      expect(source.relevance).toBe(0.85)
    }
  })

  it('encodes the search query into marketplace URLs', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Apple',
      produktname: 'MacBook Pro',
    })
    for (const source of fieldSources.verkaufspreis) {
      expect(source.url).toContain('Apple%20MacBook%20Pro')
    }
  })
})

describe('generateVerificationSources — tech review sites', () => {
  it('adds Notebookcheck as a review source on specs', () => {
    const { fieldSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Apple',
      produktname: 'MacBook',
    })
    const specsSources = fieldSources.specs || []
    expect(specsSources.some(s => s.title === 'Notebookcheck')).toBe(true)
  })

  it('adds Notebookcheck (only) to kurzbeschreibung — Geizhals is "price" type', () => {
    const { fieldSources } = generateVerificationSources(baseData)
    expect(fieldSources.kurzbeschreibung).toHaveLength(1)
    expect(fieldSources.kurzbeschreibung[0].title).toBe('Notebookcheck')
    expect(fieldSources.kurzbeschreibung[0].type).toBe('review')
  })

  it('aggregates every source into allSources (no duplicates check, just count growth)', () => {
    const { allSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Apple',
      produktname: 'MacBook',
    })
    // 1 manufacturer + 3 marketplaces + 2 tech sites = 6
    expect(allSources).toHaveLength(6)
  })

  it('allSources count is 5 for unknown brand (no manufacturer source)', () => {
    const { allSources } = generateVerificationSources({
      ...baseData,
      hersteller: 'Unknown',
      produktname: 'X',
    })
    expect(allSources).toHaveLength(5)
  })
})

// ============================================================================
// calculateFieldConfidence
// ============================================================================

describe('calculateFieldConfidence — explicit-mention boosts', () => {
  it('hersteller gets 0.95 when mentioned in input', () => {
    const { metadata } = calculateFieldConfidence(
      'Apple MacBook Pro',
      { ...baseData, hersteller: 'Apple', produktname: 'MacBook Pro' },
      'text',
    )
    expect(metadata.hersteller?.confidence).toBe(0.95)
  })

  it('hersteller drops to 0.7 when AI inferred it (not in input)', () => {
    const { metadata } = calculateFieldConfidence(
      'Refurbished Laptop',
      { ...baseData, hersteller: 'Apple' },
      'text',
    )
    expect(metadata.hersteller?.confidence).toBe(0.7)
  })

  it('produktname gets 0.9 when mentioned, 0.6 otherwise', () => {
    const mentioned = calculateFieldConfidence(
      'i bought a MacBook Pro',
      { ...baseData, produktname: 'MacBook Pro' },
      'text',
    )
    expect(mentioned.metadata.produktname?.confidence).toBe(0.9)

    const inferred = calculateFieldConfidence(
      'just a generic device',
      { ...baseData, produktname: 'MacBook Pro' },
      'text',
    )
    expect(inferred.metadata.produktname?.confidence).toBe(0.6)
  })

  it('mentions check is case-insensitive', () => {
    const { metadata } = calculateFieldConfidence(
      'apple macbook pro',
      { ...baseData, hersteller: 'Apple' },
      'text',
    )
    expect(metadata.hersteller?.confidence).toBe(0.95)
  })

  it('mention check skips short words (<= 2 chars) to avoid false positives', () => {
    // 'X1' is only 2 chars — should NOT count as mentioned
    const { metadata } = calculateFieldConfidence(
      'a typical day',
      { ...baseData, hersteller: 'X1' },
      'text',
    )
    expect(metadata.hersteller?.confidence).toBe(0.7)
  })
})

describe('calculateFieldConfidence — fixed confidences', () => {
  it('kurzbeschreibung is always 0.75', () => {
    const { metadata } = calculateFieldConfidence(
      'anything',
      { ...baseData, kurzbeschreibung: 'Some description' },
      'voice',
    )
    expect(metadata.kurzbeschreibung?.confidence).toBe(0.75)
  })

  it('hauptkategorie is always 0.8', () => {
    const { metadata } = calculateFieldConfidence(
      '',
      { ...baseData, hauptkategorie: 'Laptops' },
      'image',
    )
    expect(metadata.hauptkategorie?.confidence).toBe(0.8)
  })

  it('unterkategorie is always 0.7', () => {
    const { metadata } = calculateFieldConfidence(
      '',
      { ...baseData, unterkategorie: 'Business' },
      'text',
    )
    expect(metadata.unterkategorie?.confidence).toBe(0.7)
  })

  it('kundenprofile is always 0.6', () => {
    const { metadata } = calculateFieldConfidence(
      '',
      { ...baseData, kundenprofile: ['oma', 'student'] },
      'text',
    )
    expect(metadata.kundenprofile?.confidence).toBe(0.6)
  })
})

describe('calculateFieldConfidence — specs keyword bump', () => {
  const dataWithSpecs = {
    ...baseData,
    specs: [{ key: 'CPU', value: 'i7' }],
  }

  it('bumps specs to 0.85 when a spec keyword appears in input', () => {
    for (const kw of ['ram', 'gb', 'ssd', 'cpu', 'i5', 'i7', 'ghz', 'core']) {
      const { metadata } = calculateFieldConfidence(`16 ${kw} option`, dataWithSpecs, 'text')
      expect(metadata.specs?.confidence).toBe(0.85)
    }
  })

  it('drops specs to 0.5 when no keyword matches', () => {
    const { metadata } = calculateFieldConfidence('plain description', dataWithSpecs, 'text')
    expect(metadata.specs?.confidence).toBe(0.5)
  })

  it('omits specs metadata when specs array is empty', () => {
    const { metadata } = calculateFieldConfidence('any', baseData, 'text')
    expect(metadata.specs).toBeUndefined()
  })
})

describe('calculateFieldConfidence — verkaufspreis price pattern', () => {
  const dataWithPrice = { ...baseData, verkaufspreis: '500' }

  it('confidence 0.9 when input contains a price-like pattern', () => {
    expect(calculateFieldConfidence('500 chf', dataWithPrice, 'text').metadata.verkaufspreis?.confidence).toBe(0.9)
    expect(calculateFieldConfidence('300 franken', dataWithPrice, 'text').metadata.verkaufspreis?.confidence).toBe(0.9)
    expect(calculateFieldConfidence('250 fr', dataWithPrice, 'text').metadata.verkaufspreis?.confidence).toBe(0.9)
    expect(calculateFieldConfidence('100.-', dataWithPrice, 'text').metadata.verkaufspreis?.confidence).toBe(0.9)
  })

  it('confidence 0.4 when input has no price pattern', () => {
    const { metadata } = calculateFieldConfidence('not mentioned', dataWithPrice, 'text')
    expect(metadata.verkaufspreis?.confidence).toBe(0.4)
  })

  it('omits verkaufspreis metadata when price is empty', () => {
    const { metadata } = calculateFieldConfidence('500 chf', baseData, 'text')
    expect(metadata.verkaufspreis).toBeUndefined()
  })
})

describe('calculateFieldConfidence — zustand keyword detection', () => {
  const dataWithCondition = { ...baseData, zustand: 'good' }

  it('confidence 0.85 when a condition keyword is in input', () => {
    for (const kw of ['neu', 'new', 'gut', 'good', 'gebraucht', 'used', 'zustand', 'condition']) {
      const { metadata } = calculateFieldConfidence(`item is ${kw}`, dataWithCondition, 'text')
      expect(metadata.zustand?.confidence).toBe(0.85)
    }
  })

  it('confidence 0.5 when no condition keyword present', () => {
    const { metadata } = calculateFieldConfidence('a laptop', dataWithCondition, 'text')
    expect(metadata.zustand?.confidence).toBe(0.5)
  })
})

describe('calculateFieldConfidence — output shape + sourceType propagation', () => {
  it('every metadata entry carries the sourceType, model, and timestamp', () => {
    const before = Date.now()
    const { metadata } = calculateFieldConfidence(
      'apple macbook',
      { ...baseData, hersteller: 'Apple' },
      'voice',
      'custom-model',
    )
    const after = Date.now()
    const entry = metadata.hersteller!
    expect(entry.type).toBe('voice')
    expect(entry.model).toBe('custom-model')
    expect(entry.timestamp).toBeGreaterThanOrEqual(before)
    expect(entry.timestamp).toBeLessThanOrEqual(after)
  })

  it('attaches verification sources to each field in metadata', () => {
    const { metadata } = calculateFieldConfidence(
      'apple macbook pro',
      { ...baseData, hersteller: 'Apple', produktname: 'MacBook Pro' },
      'text',
    )
    expect(metadata.hersteller).toBeDefined()
    expect(metadata.produktname).toBeDefined()
    expect((metadata.hersteller?.sources ?? []).length).toBeGreaterThan(0)
    expect((metadata.produktname?.sources ?? []).length).toBeGreaterThan(0)
  })

  it('returns the flat allSources from generateVerificationSources too', () => {
    const { allSources } = calculateFieldConfidence(
      '',
      { ...baseData, hersteller: 'Apple', produktname: 'MacBook' },
      'text',
    )
    expect(allSources.length).toBeGreaterThan(0)
  })
})
