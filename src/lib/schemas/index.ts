// Central export for all validation schemas
export * from './auth';
export * from './reviews';
export * from './newsletter';
export * from './team';

// Re-export Zod for convenience
export { z, ZodError } from 'zod';

// Helper function to format Zod errors for API responses
import { ZodError, ZodIssue } from 'zod';

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
