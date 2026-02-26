/**
 * Config and constants for AI Camera Product Listing
 */

import {
  Smartphone,
  Laptop,
  Monitor,
  Headphones,
  HardDrive,
  Router
} from 'lucide-react'
import type { ProductSuggestion } from './types' // Used by generateProductDescription

/**
 * Condition labels (German)
 */
export const CONDITION_LABELS: Record<string, string> = {
  new: 'Neu',
  excellent: 'Wie neu',
  good: 'Gut',
  fair: 'Akzeptabel'
}

/**
 * Category to icon mapping
 */
export const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'Smartphones': Smartphone,
  'Laptops': Laptop,
  'Monitore': Monitor,
  'Zubehör': Headphones,
  'Speicher': HardDrive,
  'Netzwerk': Router
}

/**
 * Default icon when category not found
 */
export const DEFAULT_CATEGORY_ICON = Smartphone

/**
 * Get condition label in German
 */
export function getConditionLabel(condition: string): string {
  return CONDITION_LABELS[condition] || condition
}

/**
 * Get icon for category
 */
export function getCategoryIcon(category: string): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  return CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON
}

/**
 * Generate product description from suggestion
 */
export function generateProductDescription(product: ProductSuggestion): string {
  return `Automatisch erkannt: ${product.name} in ${getConditionLabel(product.condition)}em Zustand. Features: ${product.features.join(', ')}. Preisvorschlag basierend auf Marktdaten.`
}
