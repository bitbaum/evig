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
import { ZUSTAND_OPTIONS, getConditionLabel as getConditionLabelFromSSOT } from '@/config/erfassung/conditions'

/**
 * Condition labels (German) — derived from SSOT
 */
export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  ZUSTAND_OPTIONS.map(c => [c.value, c.label])
)

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
 * Get condition label in German (delegates to SSOT, supports aliases)
 */
export function getConditionLabel(condition: string): string {
  return getConditionLabelFromSSOT(condition)
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
