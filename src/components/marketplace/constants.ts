/**
 * Product Listing Constants
 * 
 * Constants for product listing form
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted constants from ProductListingForm
 */

import { ProductCondition, ProductCategory } from './types'

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: 'Laptops', label: 'Laptops' },
  { value: 'Desktops', label: 'Desktops' },
  { value: 'Monitore', label: 'Monitore' },
  { value: 'Zubehör', label: 'Zubehör' },
  { value: 'Drucker', label: 'Drucker' },
  { value: 'Netzwerk', label: 'Netzwerk' },
  { value: 'Speicher', label: 'Speicher' },
  { value: 'Sonstiges', label: 'Sonstiges' },
]

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  { 
    value: 'new', 
    label: 'Neu (Originalverpackung)', 
    description: 'Unbenutzt, originale Verpackung' 
  },
  { 
    value: 'excellent', 
    label: 'Sehr gut', 
    description: 'Kaum Gebrauchsspuren, voll funktionsfähig' 
  },
  { 
    value: 'good', 
    label: 'Gut', 
    description: 'Leichte Gebrauchsspuren, alles funktioniert' 
  },
  { 
    value: 'fair', 
    label: 'Akzeptabel', 
    description: 'Deutliche Gebrauchsspuren, aber funktionsfähig' 
  },
]

export const MAX_IMAGES = 5



