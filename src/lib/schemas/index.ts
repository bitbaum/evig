// Central export for all validation schemas
export * from './admin';
export * from './auth';
export * from './reviews';
export * from './newsletter';
export * from './team';
export * from './erfassung';
export * from './common';
export * from './payments';
export * from './appointments';
export * from './repairer';
export * from './workshops';
export * from './messages';
export * from './user';
export * from './seller';
export * from './blog';
export * from './ai';
export * from './inventory';
export * from './marketplace';
export * from './it-hilfe';

// Re-export Zod for convenience
export { z, ZodError } from 'zod';

// Helper function to format Zod errors for API responses
import { z, ZodError, ZodIssue } from 'zod';
import { apiBadRequest } from '@/lib/api/helpers';

export interface ValidationError {
  field: string;
  message: string;
}

export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Convert ZodError into Record<string, string[]> format for apiBadRequest.
 */
export function formatZodErrorsAsRecord(error: ZodError): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root';
    if (!record[field]) {
      record[field] = [];
    }
    record[field].push(issue.message);
  }
  return record;
}

/**
 * Validate a request body against a Zod schema.
 * Returns typed data on success, or a NextResponse error on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { success: false as const, error: apiBadRequest('Ungültige Eingabedaten', formatZodErrorsAsRecord(result.error)) };
  }
  return { success: true as const, data: result.data };
}

/**
 * Validate query parameters against a Zod schema.
 * Returns typed data on success, or a NextResponse error on failure.
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, params: Record<string, string | null>) {
  // Strip null values so Zod treats missing params as undefined (triggers defaults)
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null) {
      cleaned[key] = value;
    }
  }
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    return { success: false as const, error: apiBadRequest('Ungültige Abfrageparameter', formatZodErrorsAsRecord(result.error)) };
  }
  return { success: true as const, data: result.data };
}
