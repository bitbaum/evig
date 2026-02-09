/**
 * Blog Utility Functions
 * Client-safe utility functions for blog formatting
 */

// Re-export from SSOT — fixes de-DE → de-CH locale
export { formatDate } from '@/lib/date-formats'

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}


