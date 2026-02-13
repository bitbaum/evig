/**
 * Design System Tokens - SSOT for visual design
 * All colors, gradients, and styling tokens centralized here
 */

export const DESIGN_TOKENS = {
  gradients: {
    marketplace: 'from-orange-50 to-red-50',
    itHilfe: 'from-emerald-50 to-green-50',
    services: 'from-blue-50 to-indigo-50',
    about: 'from-green-50 to-teal-50',
    contact: 'from-gray-50 to-slate-50',
    getInvolved: 'from-purple-50 to-pink-50',
    workshops: 'from-yellow-50 to-orange-50',
  },

  iconBadges: {
    marketplace: { bg: 'bg-orange-100', text: 'text-orange-600' },
    itHilfe: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    services: { bg: 'bg-blue-100', text: 'text-blue-600' },
    about: { bg: 'bg-green-100', text: 'text-green-600' },
    contact: { bg: 'bg-gray-100', text: 'text-gray-600' },
    getInvolved: { bg: 'bg-purple-100', text: 'text-purple-600' },
    workshops: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  },

  buttons: {
    primary: {
      marketplace: 'bg-orange-600 hover:bg-orange-500',
      itHilfe: 'bg-emerald-600 hover:bg-emerald-500',
      services: 'bg-blue-600 hover:bg-blue-500',
      about: 'bg-green-600 hover:bg-green-500',
      contact: 'bg-gray-600 hover:bg-gray-500',
      getInvolved: 'bg-purple-600 hover:bg-purple-500',
      workshops: 'bg-yellow-600 hover:bg-yellow-500',
    },
    secondary: {
      marketplace: 'border-orange-300 text-orange-700 hover:bg-orange-50',
      itHilfe: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
      services: 'border-blue-300 text-blue-700 hover:bg-blue-50',
      about: 'border-green-300 text-green-700 hover:bg-green-50',
      contact: 'border-gray-300 text-gray-700 hover:bg-gray-50',
      getInvolved: 'border-purple-300 text-purple-700 hover:bg-purple-50',
      workshops: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
    }
  }
} as const;

export type ThemeKey = keyof typeof DESIGN_TOKENS.gradients;
