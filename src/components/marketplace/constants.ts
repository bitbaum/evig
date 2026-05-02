/**
 * Product Listing Constants
 *
 * Constants for product listing form.
 * Conditions derived from SSOT: @/config/erfassung/conditions
 * Categories derived from SSOT: @/config/erfassung/categories
 */

import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { KATEGORIEN } from '@/config/erfassung/categories'
import type { ProductCondition, ProductCategory } from './types'

/**
 * Product categories for marketplace listings.
 * Derived from KATEGORIEN SSOT (main categories only).
 */
export const PRODUCT_CATEGORIES: ProductCategory[] = KATEGORIEN.map(k => ({
  value: k.label,
  label: k.label,
}))

/**
 * Conditions available for seller product listings.
 * Subset of ZUSTAND_OPTIONS — excludes 'poor' and 'defect' (not suitable for sale).
 */
const SELLER_CONDITION_VALUES = ['new', 'like_new', 'good', 'fair'] as const

export const PRODUCT_CONDITIONS: ProductCondition[] = SELLER_CONDITION_VALUES.map(value => {
  const condition = ZUSTAND_OPTIONS.find(c => c.value === value)!
  return {
    value: condition.value,
    label: condition.label,
    description: condition.description,
  }
})

