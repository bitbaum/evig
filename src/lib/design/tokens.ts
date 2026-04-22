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
    blog: 'from-rose-50 to-pink-50',
    faq: 'from-sky-50 to-blue-50',
    space: 'from-teal-50 to-cyan-50',
    projects: 'from-indigo-50 to-violet-50',
    repairers: 'from-amber-50 to-yellow-50',
    knowhow: 'from-cyan-50 to-sky-50',
    home: 'from-emerald-50 to-teal-50',
  },

  iconBadges: {
    marketplace: { bg: 'bg-orange-100', text: 'text-orange-600' },
    itHilfe: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    services: { bg: 'bg-blue-100', text: 'text-blue-600' },
    about: { bg: 'bg-green-100', text: 'text-green-600' },
    contact: { bg: 'bg-gray-100', text: 'text-gray-600' },
    getInvolved: { bg: 'bg-purple-100', text: 'text-purple-600' },
    workshops: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    blog: { bg: 'bg-rose-100', text: 'text-rose-600' },
    faq: { bg: 'bg-sky-100', text: 'text-sky-600' },
    space: { bg: 'bg-teal-100', text: 'text-teal-600' },
    projects: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    repairers: { bg: 'bg-amber-100', text: 'text-amber-600' },
    knowhow: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    home: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
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
      blog: 'bg-rose-600 hover:bg-rose-500',
      faq: 'bg-sky-600 hover:bg-sky-500',
      space: 'bg-teal-600 hover:bg-teal-500',
      projects: 'bg-indigo-600 hover:bg-indigo-500',
      repairers: 'bg-amber-600 hover:bg-amber-500',
      knowhow: 'bg-cyan-600 hover:bg-cyan-500',
      home: 'bg-emerald-600 hover:bg-emerald-500',
    },
    secondary: {
      marketplace: 'border-orange-300 text-orange-700 hover:bg-orange-50',
      itHilfe: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
      services: 'border-blue-300 text-blue-700 hover:bg-blue-50',
      about: 'border-green-300 text-green-700 hover:bg-green-50',
      contact: 'border-gray-300 text-gray-700 hover:bg-gray-50',
      getInvolved: 'border-purple-300 text-purple-700 hover:bg-purple-50',
      workshops: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
      blog: 'border-rose-300 text-rose-700 hover:bg-rose-50',
      faq: 'border-sky-300 text-sky-700 hover:bg-sky-50',
      space: 'border-teal-300 text-teal-700 hover:bg-teal-50',
      projects: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
      repairers: 'border-amber-300 text-amber-700 hover:bg-amber-50',
      knowhow: 'border-cyan-300 text-cyan-700 hover:bg-cyan-50',
      home: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    }
  },

  // Focus ring for keyboard navigation — matches the theme's primary color
  focusOutline: {
    marketplace: 'focus-visible:outline-orange-600',
    itHilfe: 'focus-visible:outline-emerald-600',
    services: 'focus-visible:outline-blue-600',
    about: 'focus-visible:outline-green-600',
    contact: 'focus-visible:outline-gray-600',
    getInvolved: 'focus-visible:outline-purple-600',
    workshops: 'focus-visible:outline-yellow-600',
    blog: 'focus-visible:outline-rose-600',
    faq: 'focus-visible:outline-sky-600',
    space: 'focus-visible:outline-teal-600',
    projects: 'focus-visible:outline-indigo-600',
    repairers: 'focus-visible:outline-amber-600',
    knowhow: 'focus-visible:outline-cyan-600',
    home: 'focus-visible:outline-emerald-600',
  },

  // Card-level tokens
  cards: {
    // Title color on hover — matches the theme's icon/badge text color
    hoverText: {
      marketplace: 'group-hover:text-orange-600',
      itHilfe: 'group-hover:text-emerald-600',
      services: 'group-hover:text-blue-600',
      about: 'group-hover:text-green-600',
      contact: 'group-hover:text-gray-600',
      getInvolved: 'group-hover:text-purple-600',
      workshops: 'group-hover:text-yellow-600',
      blog: 'group-hover:text-rose-600',
      faq: 'group-hover:text-sky-600',
      space: 'group-hover:text-teal-600',
      projects: 'group-hover:text-indigo-600',
      repairers: 'group-hover:text-amber-600',
      knowhow: 'group-hover:text-cyan-600',
      home: 'group-hover:text-emerald-600',
    },
    // Border variants for community/feature cards
    border: {
      default: 'border-gray-200',
      featured: 'border-purple-300 ring-1 ring-purple-200',
    },
  },
} as const;

export type ThemeKey = keyof typeof DESIGN_TOKENS.gradients;
