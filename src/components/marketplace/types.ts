/**
 * Product Listing Types
 * 
 * Type definitions for product listing form
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted types from ProductListingForm
 */

export interface ProductFormData {
  title: string
  description: string
  price: string
  category: string
  brand: string
  condition: string
  images: File[]
  location: string
  contactInfo: string
}

export interface ProductCondition {
  value: string
  label: string
  description: string
}

export interface ProductCategory {
  value: string
  label: string
}

export interface ProductListingErrors {
  title?: string
  description?: string
  price?: string
  category?: string
  condition?: string
  location?: string
}



