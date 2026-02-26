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
  getProfilesByCategory,
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
  getCategoryDetails,
  type Kategorie,
  type SubKategorie,
} from './categories'

// Conditions
export {
  ZUSTAND_OPTIONS,
  CONDITION_ALIASES,
  getConditionByValue,
  getConditionLabel,
  normalizeConditionValue,
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
  templateToSpecFields,
  type SpecTemplate,
} from './spec-templates'

// Bulk erfassung config
export {
  BULK_TABLE_COLUMNS,
  BULK_LIMITS,
  CSV_COLUMN_ALIASES,
  type BulkTableColumn,
} from './bulk'
