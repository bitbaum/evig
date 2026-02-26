/**
 * Zod Schema → AI Prompt Schema Generator
 *
 * Converts a Zod object schema + field descriptions map into the JSON schema
 * string used in AI prompts. SSOT: adding a field to the Zod schema +
 * adding a description entry here = AI automatically extracts it.
 */

import type { ZodObject, ZodRawShape } from 'zod'

/**
 * Map of field names to their AI-friendly descriptions.
 * The AI sees these descriptions to know what to extract for each field.
 * Nested objects represent array element shapes (e.g. specs: { key: '...', value: '...' }).
 */
export type FieldDescriptions = Record<string, string | Record<string, string>>

/**
 * Generate a JSON schema string for AI prompts from a Zod object schema
 * and a descriptions map. Only fields present in BOTH the schema and
 * descriptions map are included (descriptions act as an allowlist).
 */
export function zodSchemaToPromptString(
  schema: ZodObject<ZodRawShape>,
  descriptions: FieldDescriptions,
): string {
  const shape = schema.shape
  const result: Record<string, unknown> = {}

  for (const [key, desc] of Object.entries(descriptions)) {
    // Only include fields that exist in the Zod schema
    if (!(key in shape)) continue

    // Zod v4: `.type` is a public property on every schema ('string', 'array', etc.)
    const isArray = (shape[key] as { type?: string }).type === 'array'

    if (typeof desc === 'string') {
      result[key] = isArray ? [desc] : desc
    } else {
      // Nested object description — wrap in array for array fields
      result[key] = isArray ? [desc] : desc
    }
  }

  return JSON.stringify(result, null, 2)
}
