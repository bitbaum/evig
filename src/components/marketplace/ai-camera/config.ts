/**
 * Config and constants for AI Camera Product Listing
 */

import {
  Laptop,
  Monitor,
  Tablet,
  Smartphone,
  Printer,
  Cpu,
  Keyboard,
  Network,
  Package,
} from 'lucide-react'
import type { ProductSuggestion } from './types' // Used by generateProductDescription
import { ZUSTAND_OPTIONS, getConditionLabel as getConditionLabelFromSSOT } from '@/config/erfassung/conditions'
import { resolveCategoryValue } from '@/config/marketplace'

/**
 * Condition labels (German) — derived from SSOT
 */
export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  ZUSTAND_OPTIONS.map(c => [c.value, c.label])
)

/**
 * Category icon components, keyed by KATEGORIEN value (the single category
 * taxonomy). Consumers resolve any free-text/AI label to a KATEGORIEN value
 * (via resolveCategoryValue) before looking up here, so this never has to know
 * about category names or aliases — those live in the marketplace SSOT.
 */
export const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  '10': Laptop,      // Laptops
  '20': Monitor,     // Desktop PCs
  '30': Monitor,     // Monitore
  '40': Tablet,      // Tablets
  '50': Smartphone,  // Smartphones
  '60': Printer,     // Drucker & Scanner
  '70': Cpu,         // Komponenten
  '80': Keyboard,    // Peripherie
  '90': Network,     // Netzwerk
}

/**
 * Default icon when the resolved category has no dedicated icon (e.g. '99').
 */
export const DEFAULT_CATEGORY_ICON = Package

/**
 * Get condition label in German (delegates to SSOT, supports aliases)
 */
export function getConditionLabel(condition: string): string {
  return getConditionLabelFromSSOT(condition)
}

/**
 * Get icon for a category — accepts a KATEGORIEN value or any free-text/AI
 * label, resolves it to the canonical taxonomy, then maps to an icon.
 * Use in non-render contexts; components should look up CATEGORY_ICONS directly
 * (a stable reference) to satisfy react-hooks/static-components.
 */
export function getCategoryIcon(category: string): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  return CATEGORY_ICONS[resolveCategoryValue(category)] || DEFAULT_CATEGORY_ICON
}

/**
 * Generate product description from suggestion
 */
export function generateProductDescription(product: ProductSuggestion): string {
  return `Automatisch erkannt: ${product.name} in ${getConditionLabel(product.condition)}em Zustand. Features: ${product.features.join(', ')}. Preisvorschlag basierend auf Marktdaten.`
}
