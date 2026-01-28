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
import type { ProductSuggestion } from './types'

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
 * Mock AI suggestions for demo
 * In production, this would come from an AI service
 */
export const MOCK_AI_SUGGESTIONS: ProductSuggestion[] = [
  {
    id: 'iphone13promax',
    name: 'iPhone 13 Pro Max',
    category: 'Smartphones',
    estimatedPrice: 850,
    confidence: 0.92,
    brand: 'Apple',
    model: 'iPhone 13 Pro Max',
    condition: 'excellent',
    features: ['256GB Speicher', 'Triple-Kamera', 'Pro Motion Display', '5G'],
    icon: Smartphone
  },
  {
    id: 'iphone12promax',
    name: 'iPhone 12 Pro Max',
    category: 'Smartphones',
    estimatedPrice: 650,
    confidence: 0.78,
    brand: 'Apple',
    model: 'iPhone 12 Pro Max',
    condition: 'good',
    features: ['128GB Speicher', 'Triple-Kamera', 'OLED Display', 'Face ID'],
    icon: Smartphone
  },
  {
    id: 'samsungs21',
    name: 'Samsung Galaxy S21',
    category: 'Smartphones',
    estimatedPrice: 450,
    confidence: 0.65,
    brand: 'Samsung',
    model: 'Galaxy S21',
    condition: 'good',
    features: ['128GB Speicher', 'Triple-Kamera', '120Hz Display'],
    icon: Smartphone
  }
]

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
