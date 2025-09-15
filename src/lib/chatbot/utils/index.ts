/**
 * Utility functions for the chatbot system
 *
 * Common helper functions used across different chatbot services
 */

import { Language, NavigationSuggestion } from '../types'

/**
 * Normalize text for better matching
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * Tokenize text into meaningful words
 */
export function tokenize(text: string, minLength = 2): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(word => word.length >= minLength)
}

/**
 * Calculate text similarity score (0-1)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokens1 = tokenize(text1)
  const tokens2 = tokenize(text2)

  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0
  }

  const intersection = tokens1.filter(token => tokens2.includes(token))
  const union = [...new Set([...tokens1, ...tokens2])]

  return intersection.length / union.length
}

/**
 * Remove duplicates from suggestions array based on href
 */
export function deduplicateSuggestions(suggestions: NavigationSuggestion[]): NavigationSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter(suggestion => {
    if (seen.has(suggestion.href)) {
      return false
    }
    seen.add(suggestion.href)
    return true
  })
}

/**
 * Sort suggestions by priority (higher first)
 */
export function sortSuggestionsByPriority(suggestions: NavigationSuggestion[]): NavigationSuggestion[] {
  return [...suggestions].sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

/**
 * Detect if text contains buying intent
 */
export function detectBuyingIntent(text: string, language: Language): boolean {
  const buyingKeywords = language === 'de'
    ? ['kaufen', 'bestellen', 'shop', 'erwerben', 'anschaffen']
    : ['buy', 'purchase', 'shop', 'get', 'acquire', 'order']

  const normalizedText = normalizeText(text)
  return buyingKeywords.some(keyword => normalizedText.includes(keyword))
}

/**
 * Detect if text contains repair intent
 */
export function detectRepairIntent(text: string, language: Language): boolean {
  const repairKeywords = language === 'de'
    ? ['reparieren', 'reparatur', 'kaputt', 'defekt', 'problem', 'funktioniert nicht', 'fix']
    : ['repair', 'fix', 'broken', 'problem', 'issue', 'not working', 'malfunction']

  const normalizedText = normalizeText(text)
  return repairKeywords.some(keyword => normalizedText.includes(keyword))
}

/**
 * Extract mentioned product types from text
 */
export function extractProductMentions(text: string, language: Language): string[] {
  const products = language === 'de'
    ? ['computer', 'laptop', 'desktop', 'pc', 'server', 'tablet', 'monitor', 'bildschirm']
    : ['computer', 'laptop', 'desktop', 'pc', 'server', 'tablet', 'monitor', 'screen']

  const normalizedText = normalizeText(text)
  return products.filter(product => normalizedText.includes(product))
}

/**
 * Check if current time is within business hours
 */
export function isBusinessHours(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()

  // Monday to Friday, 9 AM to 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour <= 17
}

/**
 * Generate session ID for conversation tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substr(0, maxLength - 3) + '...'
}

/**
 * Format response for logging (removes sensitive data)
 */
export function formatForLogging(text: string): string {
  return truncateText(text, 100).replace(/[\r\n]/g, ' ')
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname !== window.location.hostname
  } catch {
    return false // Relative URLs are considered internal
  }
}

/**
 * Get appropriate emoji for suggestion category
 */
export function getCategoryEmoji(category: NavigationSuggestion['category']): string {
  const emojiMap = {
    service: '🔧',
    product: '🛒',
    info: '📚',
    involvement: '🤝',
    contact: '📞'
  }

  return emojiMap[category || 'info'] || '📄'
}

/**
 * Validate conversation context
 */
export function isValidContext(context: any): boolean {
  return (
    context &&
    typeof context.currentPage === 'string' &&
    typeof context.language === 'string' &&
    Array.isArray(context.userHistory)
  )
}