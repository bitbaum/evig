/**
 * Formatting utilities
 */

import type { NumberFormat } from './types';

/**
 * Format a number value according to the specified format
 */
export function formatValue(value: number | string, format: NumberFormat): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return String(value);
  }
  
  switch (format) {
    case 'CHF':
      return formatCHF(numValue);
    case 'percent':
      return formatPercent(numValue);
    case 'number':
    default:
      return formatNumber(numValue);
  }
}

/**
 * Format number as Swiss Franc (CHF)
 */
export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format generic number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-CH').format(value);
}

/**
 * Format date in Swiss German format
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}
