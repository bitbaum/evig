/**
 * Client-safe heuristic to detect if text contains multiple products.
 *
 * Pure regex/line counting — no server imports (no AI, no DB).
 * Safe to import from 'use client' components.
 */

export function detectMultipleProducts(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  // Split by newlines and filter out empty lines
  const lines = trimmed.split(/\n+/).map(l => l.trim()).filter(l => l.length > 3)
  if (lines.length < 2) return false

  // Check for numbered list patterns: "1. ...", "1) ...", "#1 ..."
  const numberedLines = lines.filter(l => /^\d+[\.\)\s]/.test(l))
  if (numberedLines.length >= 2) return true

  // Check for bullet point patterns: "- ...", "• ...", "* ..."
  const bulletLines = lines.filter(l => /^[-•*]\s/.test(l))
  if (bulletLines.length >= 2) return true

  // Check for CSV-like structure (lines with consistent delimiters)
  const csvLines = lines.filter(l => (l.match(/[,;|\t]/g) || []).length >= 2)
  if (csvLines.length >= 2) return true

  // Check for multiple product-like lines (containing brand/model patterns)
  const productPatterns = /\b(dell|hp|lenovo|apple|asus|acer|thinkpad|latitude|elitebook|macbook|surface|samsung)\b/i
  const productLines = lines.filter(l => productPatterns.test(l))
  if (productLines.length >= 2) return true

  // Check for lines with price patterns (multiple products with prices)
  const pricePattern = /\d{2,4}\s*(chf|franken|fr\.?|sfr|.-)?$/i
  const priceLines = lines.filter(l => pricePattern.test(l.trim()))
  if (priceLines.length >= 2) return true

  // Simple line count heuristic: 3+ non-trivial lines
  if (lines.length >= 3) {
    // Check if lines look product-like (have some numbers/specs)
    const specLines = lines.filter(l => /\d/.test(l) && l.length > 10)
    if (specLines.length >= 2) return true
  }

  return false
}
