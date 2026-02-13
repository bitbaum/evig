/**
 * UI Colors Configuration
 *
 * SSOT for color schemes across marketplace and IT-Hilfe sections.
 * Eliminates hardcoded color classes and ensures consistency.
 */

export const COLORS = {
  marketplace: {
    primary: 'green-600',
    primaryHover: 'green-700',
    primaryLight: 'green-100',
    gradient: 'from-green-600 to-blue-600',
    text: 'green-600',
    textDark: 'green-700',
    bg: 'green-50',
    border: 'green-200',
  },
  itHilfe: {
    primary: 'emerald-600',
    primaryHover: 'emerald-700',
    primaryLight: 'emerald-100',
    gradient: 'from-emerald-600 to-teal-600',
    text: 'emerald-600',
    textDark: 'emerald-700',
    bg: 'emerald-50',
    border: 'emerald-200',
  },
  common: {
    success: 'green-600',
    error: 'red-600',
    warning: 'yellow-600',
    info: 'blue-600',
    muted: 'gray-500',
    mutedLight: 'gray-100',
    mutedDark: 'gray-700',
  },
} as const

/**
 * Helper function to get themed color classes
 */
export function getThemeColors(theme: 'marketplace' | 'itHilfe') {
  return COLORS[theme]
}
