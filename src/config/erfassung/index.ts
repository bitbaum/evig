/**
 * Erfassung Configuration - Single Export Point
 *
 * All product erfassung configuration in one place.
 * Import from here instead of individual files.
 *
 * @example
 * import {
 *   CUSTOMER_PROFILES,
 *   KATEGORIEN,
 *   ZUSTAND_OPTIONS,
 *   SPEC_TEMPLATES,
 *   getConditionLabel,
 *   getSpecTemplate,
 * } from '@/config/erfassung'
 */

// Customer profiles
export {
  CUSTOMER_PROFILES,
  getProfileBySlug,
  getProfilesBySlugs,
  validateProfileSlugs,
  type CustomerProfile,
} from './profiles'

// Categories
export {
  KATEGORIEN,
  getCategoryByValue,
  getSubcategoryByValue,
  getParentCategory,
  getSubcategories,
  getAllCategoriesFlat,
  type Kategorie,
  type SubKategorie,
} from './categories'

// Conditions
export {
  ZUSTAND_OPTIONS,
  CONDITION_ALIASES,
  getConditionByValue,
  getConditionLabel,
  parseConditionFromText,
  type Condition,
  type ZustandValue,
} from './conditions'

// Spec templates
export {
  SPEC_TEMPLATES,
  getSpecTemplate,
  getSpecTemplateForSubcategory,
  mergeWithTemplate,
} from './spec-templates'
