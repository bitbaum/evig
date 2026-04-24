import { normalizeSpecValue } from '../spec-utils'

describe('normalizeSpecValue', () => {
  // ── TB → GB conversion ──────────────────────────────────────────────────────
  describe('TB conversion', () => {
    it('converts "1 TB" → 1000', () => {
      expect(normalizeSpecValue('Speicher', '1 TB')).toBe(1000)
    })

    it('converts "2TB" (no space) → 2000', () => {
      expect(normalizeSpecValue('Speicher', '2TB')).toBe(2000)
    })

    it('converts fractional TB: "0.5 TB" → 500', () => {
      expect(normalizeSpecValue('Speicher', '0.5 TB')).toBe(500)
    })

    it('converts "1.5 TB SSD" → 1500', () => {
      expect(normalizeSpecValue('Speicher', '1.5 TB SSD')).toBe(1500)
    })

    it('is case-insensitive: "2 tb" → 2000', () => {
      expect(normalizeSpecValue('Speicher', '2 tb')).toBe(2000)
    })
  })

  // ── GB / plain numeric extraction ──────────────────────────────────────────
  describe('GB and generic numeric extraction', () => {
    it('extracts "16 GB" → 16', () => {
      expect(normalizeSpecValue('RAM', '16 GB')).toBe(16)
    })

    it('extracts "256GB SSD" → 256', () => {
      expect(normalizeSpecValue('Speicher', '256GB SSD')).toBe(256)
    })

    it('extracts "8GB" (no space) → 8', () => {
      expect(normalizeSpecValue('RAM', '8GB')).toBe(8)
    })

    it('extracts display "14 Zoll" → 14', () => {
      expect(normalizeSpecValue('Display', '14 Zoll')).toBe(14)
    })

    it('extracts display "15.6 Zoll" → 15.6', () => {
      expect(normalizeSpecValue('Display', '15.6 Zoll')).toBe(15.6)
    })

    it('extracts plain integer "32" → 32', () => {
      expect(normalizeSpecValue('RAM', '32')).toBe(32)
    })

    it('handles comma decimals: "15,6 Zoll" → 15.6', () => {
      expect(normalizeSpecValue('Display', '15,6 Zoll')).toBe(15.6)
    })
  })

  // ── No numeric value → null ─────────────────────────────────────────────────
  describe('null cases', () => {
    it('returns null for empty string', () => {
      expect(normalizeSpecValue('RAM', '')).toBeNull()
    })

    it('returns null for text-only value', () => {
      expect(normalizeSpecValue('RAM', 'keine Angabe')).toBeNull()
    })

    it('returns null for text with no digits', () => {
      expect(normalizeSpecValue('RAM', 'unbekannt')).toBeNull()
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('takes the first numeric match from complex strings', () => {
      // "512 GB SSD (NVMe)" — first number is 512
      expect(normalizeSpecValue('Speicher', '512 GB SSD (NVMe)')).toBe(512)
    })

    it('TB match wins over leading digits when TB appears', () => {
      // "1 TB (1000 GB)" — TB pattern matches first → 1000
      expect(normalizeSpecValue('Speicher', '1 TB (1000 GB)')).toBe(1000)
    })

    it('handles large RAM values correctly', () => {
      expect(normalizeSpecValue('RAM', '128 GB ECC')).toBe(128)
    })

    it('trims whitespace before parsing', () => {
      expect(normalizeSpecValue('RAM', '  16 GB  ')).toBe(16)
    })
  })
})
