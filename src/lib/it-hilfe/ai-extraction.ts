/**
 * AI Extraction Service for IT-Hilfe
 *
 * Extracts structured IT help request data from natural language text.
 * Uses the generic AI extraction service with IT-Hilfe-specific config.
 */

import { logger } from '@/lib/logger'
import { extractWithFallback, type ExtractResult } from '@/lib/ai/extract'
import { IT_HILFE_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { getCategoryById, getSkillById } from '@/config/it-hilfe'

// =============================================================================
// TYPES
// =============================================================================

export interface ITHilfeExtractedData {
  categoryId: string
  deviceBrand: string
  deviceModel: string
  title: string
  description: string
  urgency: string
  skillsNeeded: string[]
  diagnosis: string
}

export interface ITHilfeExtractionResult {
  success: true
  data: ITHilfeExtractedData
  model: string
  confidence: Record<string, number>
}

export interface ITHilfeExtractionError {
  success: false
  error: string
}

export type ExtractITHilfeResult = ITHilfeExtractionResult | ITHilfeExtractionError

// =============================================================================
// VALID VALUES (for clamping AI output)
// =============================================================================

const VALID_CATEGORIES = [
  'laptop', 'smartphone', 'tablet', 'desktop', 'console',
  'audio', 'peripheral', 'storage', 'wearable', 'network',
]

const VALID_URGENCIES = ['low', 'normal', 'high', 'urgent']

// =============================================================================
// EXTRACTION
// =============================================================================

/**
 * Extract structured IT help request data from free-text description
 */
export async function extractITHilfeFromText(
  text: string,
): Promise<ExtractITHilfeResult> {
  if (!text || text.trim().length < 5) {
    return { success: false, error: 'Bitte beschreibe dein Problem ausführlicher.' }
  }

  const userPrompt = fillPromptTemplate(IT_HILFE_PROMPTS.extract, {
    text: text.trim(),
    schema: IT_HILFE_PROMPTS.schema,
  })

  const result: ExtractResult = await extractWithFallback({
    formType: 'it-hilfe',
    systemPrompt: IT_HILFE_PROMPTS.system,
    userPrompt,
    parseResponse: (raw) => raw as Record<string, unknown>,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  const raw = result.data

  // Validate and clamp values
  const categoryId = VALID_CATEGORIES.includes(String(raw.categoryId))
    ? String(raw.categoryId)
    : 'laptop'

  const urgency = VALID_URGENCIES.includes(String(raw.urgency))
    ? String(raw.urgency)
    : 'normal'

  // Filter skills to only valid IDs
  const rawSkills = Array.isArray(raw.skillsNeeded) ? raw.skillsNeeded : []
  const skillsNeeded = rawSkills
    .map(String)
    .filter(id => getSkillById(id) !== undefined)

  const diagnosis = String(raw.diagnosis || '').slice(0, 500)

  const data: ITHilfeExtractedData = {
    categoryId,
    deviceBrand: String(raw.deviceBrand || ''),
    deviceModel: String(raw.deviceModel || ''),
    title: String(raw.title || '').slice(0, 100),
    description: String(raw.description || ''),
    urgency,
    skillsNeeded,
    diagnosis,
  }

  // Calculate basic confidence scores
  const inputLower = text.toLowerCase()
  const confidence: Record<string, number> = {
    categoryId: getCategoryById(categoryId) ? 0.8 : 0.5,
    deviceBrand: data.deviceBrand && inputLower.includes(data.deviceBrand.toLowerCase()) ? 0.9 : 0.6,
    deviceModel: data.deviceModel && inputLower.includes(data.deviceModel.toLowerCase()) ? 0.9 : 0.5,
    title: 0.75,
    description: 0.8,
    urgency: 0.7,
    skillsNeeded: skillsNeeded.length > 0 ? 0.7 : 0.5,
    diagnosis: diagnosis ? 0.75 : 0.5,
  }

  logger.info('IT-Hilfe extraction successful', {
    category: data.categoryId,
    brand: data.deviceBrand,
    model: result.model,
    skillCount: skillsNeeded.length,
  })

  return {
    success: true,
    data,
    model: result.model,
    confidence,
  }
}
