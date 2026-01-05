/**
 * Product Listing Validation
 * 
 * Validation logic for product listing form
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted validation from ProductListingForm
 */

import { ProductFormData, ProductListingErrors } from './types'

/**
 * Validate product form data
 */
export function validateProductForm(formData: ProductFormData): ProductListingErrors {
  const errors: ProductListingErrors = {}

  if (!formData.title.trim()) {
    errors.title = 'Titel ist erforderlich'
  }

  if (!formData.description.trim()) {
    errors.description = 'Beschreibung ist erforderlich'
  }

  if (!formData.price.trim()) {
    errors.price = 'Preis ist erforderlich'
  } else {
    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Gültiger Preis erforderlich'
    }
  }

  if (!formData.category) {
    errors.category = 'Kategorie ist erforderlich'
  }

  if (!formData.condition) {
    errors.condition = 'Zustand ist erforderlich'
  }

  if (!formData.location.trim()) {
    errors.location = 'Standort ist erforderlich'
  }

  return errors
}

/**
 * Check if form is valid
 */
export function isFormValid(errors: ProductListingErrors): boolean {
  return Object.keys(errors).length === 0
}



