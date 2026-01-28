/**
 * Types for AI Camera Product Listing
 */

export interface ProductSuggestion {
  id: string
  name: string
  category: string
  estimatedPrice: number
  confidence: number
  brand?: string
  model?: string
  condition: 'new' | 'excellent' | 'good' | 'fair'
  features: string[]
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export interface DetectedProductData {
  title?: string
  price?: string
  category?: string
  brand?: string
  condition?: string
  description?: string
  images?: string[] | File[]
  location?: string
  contactInfo?: string
}

export interface AICameraProductListingProps {
  onProductDetected: (product: DetectedProductData) => void
  onClose: () => void
}
