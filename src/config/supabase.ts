/**
 * Supabase configuration
 * 
 * Single Source of Truth for Supabase configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

/**
 * Validates that required Supabase configuration is present
 * Throws error if critical config is missing
 */
export function validateSupabaseConfig(): void {
  if (!SUPABASE_CONFIG.URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!SUPABASE_CONFIG.ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
}
