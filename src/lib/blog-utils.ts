/**
 * Blog utilities safe to import from client components
 * (no fs / server-only deps).
 */

const WORDS_PER_MINUTE = 200

/** Estimated reading time in minutes for a blog post body. */
export function getReadingTime(content: string): number {
  return Math.ceil(content.trim().split(/\s+/).length / WORDS_PER_MINUTE)
}
