/**
 * Typography system - Consistent heading and text sizes
 * Single Source of Truth for all typography
 */

export const typography = {
  h1: 'text-4xl md:text-5xl font-bold leading-tight',
  h2: 'text-3xl md:text-4xl font-bold leading-tight',
  h3: 'text-2xl md:text-3xl font-semibold leading-snug',
  h4: 'text-xl md:text-2xl font-semibold leading-snug',
  h5: 'text-lg md:text-xl font-semibold',
  h6: 'text-base md:text-lg font-semibold',
  body: 'text-base leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  bodySmall: 'text-sm leading-normal',
  caption: 'text-xs leading-normal',
} as const;

export const textColors = {
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
  muted: 'text-muted-foreground/70',
  accent: 'text-revamp-blue',
  success: 'text-revamp-green',
  warning: 'text-revamp-orange',
  danger: 'text-error-600',
} as const;
