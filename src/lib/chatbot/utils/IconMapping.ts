/**
 * Icon mapping utility for consistent chatbot suggestions
 *
 * Provides a centralized system for mapping suggestion types to appropriate icons
 */

export interface IconConfig {
  emoji: string
  fallback: string
}

export const SUGGESTION_ICONS: Record<string, IconConfig> = {
  // Services
  'repair': { emoji: '🔧', fallback: '🛠️' },
  'computer-repair': { emoji: '💻', fallback: '🔧' },
  'data-recovery': { emoji: '💾', fallback: '📀' },
  'linux': { emoji: '🐧', fallback: '💻' },
  'web': { emoji: '🌐', fallback: '💻' },
  'cloud': { emoji: '☁️', fallback: '🌐' },
  'ai': { emoji: '🤖', fallback: '💻' },
  'service': { emoji: '🔧', fallback: '🛠️' },

  // Products
  'shop': { emoji: '🛒', fallback: '🏪' },
  'computer': { emoji: '💻', fallback: '🖥️' },
  'laptop': { emoji: '💻', fallback: '🖥️' },
  'hardware': { emoji: '⚙️', fallback: '🔧' },
  'product': { emoji: '🛒', fallback: '📦' },

  // Information
  'about': { emoji: '📖', fallback: 'ℹ️' },
  'mission': { emoji: '🎯', fallback: '📖' },
  'team': { emoji: '👥', fallback: '👨‍👩‍👧‍👦' },
  'certification': { emoji: '🏷️', fallback: '✅' },
  'wiki': { emoji: '📚', fallback: '📖' },
  'info': { emoji: '📚', fallback: 'ℹ️' },
  'blog': { emoji: '📰', fallback: '📖' },

  // Involvement
  'volunteer': { emoji: '🤝', fallback: '👥' },
  'donate': { emoji: '💝', fallback: '💰' },
  'partnership': { emoji: '🏢', fallback: '🤝' },
  'technical': { emoji: '👨‍💻', fallback: '💻' },
  'internship': { emoji: '💼', fallback: '🎓' },
  'involvement': { emoji: '🤝', fallback: '👥' },

  // Projects
  'project': { emoji: '💼', fallback: '📋' },
  'freie-computer': { emoji: '🖥️', fallback: '💻' },
  'ltsp': { emoji: '🌐', fallback: '🖥️' },
  'kivitendo': { emoji: '📊', fallback: '💼' },
  'hardware-project': { emoji: '💻', fallback: '⚙️' },

  // Contact & Support
  'contact': { emoji: '📞', fallback: '☎️' },
  'email': { emoji: '📧', fallback: '✉️' },
  'location': { emoji: '📍', fallback: '🏢' },
  'support': { emoji: '🆘', fallback: '❓' },
  'consultation': { emoji: '💬', fallback: '🗨️' },

  // Learning
  'workshop': { emoji: '📚', fallback: '🎓' },
  'course': { emoji: '🎓', fallback: '📚' },
  'learning': { emoji: '📖', fallback: '🎓' },
  'education': { emoji: '🎓', fallback: '📚' },

  // Navigation
  'home': { emoji: '🏠', fallback: '🏡' },
  'back': { emoji: '◀️', fallback: '⬅️' },
  'external': { emoji: '🔗', fallback: '↗️' },
  'navigation': { emoji: '🧭', fallback: '➡️' },

  // Actions
  'quote': { emoji: '💭', fallback: '💬' },
  'call': { emoji: '📞', fallback: '☎️' },
  'visit': { emoji: '👁️', fallback: '👀' },
  'explore': { emoji: '🔍', fallback: '👁️' },
  'discover': { emoji: '✨', fallback: '🔍' }
}

/**
 * Get icon for a suggestion based on its label or href
 */
export function getSuggestionIcon(
  label: string,
  href: string,
  category?: string
): string {
  const labelLower = label.toLowerCase()
  const hrefLower = href.toLowerCase()

  // Try to match by specific keywords in label
  for (const [key, config] of Object.entries(SUGGESTION_ICONS)) {
    if (labelLower.includes(key) ||
        labelLower.includes(key.replace('-', ' ')) ||
        hrefLower.includes(key)) {
      return config.emoji
    }
  }

  // Try to match by category
  if (category) {
    const categoryIcon = SUGGESTION_ICONS[category]
    if (categoryIcon) {
      return categoryIcon.emoji
    }
  }

  // Default based on href patterns
  if (hrefLower.includes('shop') || hrefLower.includes('buy')) {
    return SUGGESTION_ICONS.shop.emoji
  }
  if (hrefLower.includes('service')) {
    return SUGGESTION_ICONS.service.emoji
  }
  if (hrefLower.includes('contact')) {
    return SUGGESTION_ICONS.contact.emoji
  }
  if (hrefLower.includes('about')) {
    return SUGGESTION_ICONS.about.emoji
  }
  if (hrefLower.includes('project')) {
    return SUGGESTION_ICONS.project.emoji
  }
  if (hrefLower.includes('volunteer') || hrefLower.includes('involved')) {
    return SUGGESTION_ICONS.volunteer.emoji
  }
  if (hrefLower.includes('workshop')) {
    return SUGGESTION_ICONS.workshop.emoji
  }

  // Default fallback
  return '📄'
}

/**
 * Ensure a label has an icon prefix
 */
export function ensureIconInLabel(label: string, href: string, category?: string): string {
  // Check if label already has an emoji
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(label)) {
    return label
  }

  const icon = getSuggestionIcon(label, href, category)
  return `${icon} ${label}`
}