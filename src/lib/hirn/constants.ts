/**
 * App-wide constants
 * Single Source of Truth for configuration values
 */

// Revamp-IT Brand Colors
export const BRAND_COLORS = {
  green: '#2ECC71',
  blue: '#3498DB',
  orange: '#E67E22',
  greyDark: '#2C3E50',
  greyMedium: '#7F8C8D',
  greyLight: '#ECF0F1',
} as const;

// Navigation Links
export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/finanzen', label: 'Finanzen' },
  { href: '/kennzahlen', label: 'Kennzahlen' },
  { href: '/wirkung', label: 'Wirkung' },
  { href: '/transparenz', label: 'Transparenz' },
  { href: '/ueber-uns', label: 'Über uns' },
] as const;

// Number Formats
export const NUMBER_FORMATS = {
  CHF: 'CHF',
  PERCENT: 'percent',
  NUMBER: 'number',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  numbers: '/api/numbers',
  financial: '/api/data/financial',
  kpis: '/api/data/kpis',
} as const;
