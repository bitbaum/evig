/**
 * Spec Value Normalization — Domain Logic
 *
 * Parses spec strings like "16 GB", "1 TB", "14 Zoll" into numeric values
 * for filtering and search indexing. This is data transformation logic,
 * not configuration.
 */

/**
 * Extract numeric value and normalize to a standard unit for filtering.
 * Examples: "16 GB" → 16, "1 TB" → 1000, "14 Zoll" → 14, "512GB SSD" → 512
 */
export function normalizeSpecValue(key: string, value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,]/g, '.').trim()

  // TB → GB conversion
  const tbMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*TB/i)
  if (tbMatch) return parseFloat(tbMatch[1]) * 1000

  // General numeric extraction (works for "16 GB", "14 Zoll", "256GB SSD", etc.)
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) return parseFloat(numMatch[1])

  return null
}
