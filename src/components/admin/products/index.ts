/**
 * Product management components
 *
 * Extracted from the original 921-line ProductManagement.tsx
 * Following DRY and separation of concerns principles.
 */

export * from './types'
export { ProductTabSwitcher } from './ProductTabSwitcher'
export { ProductStatsCards } from './ProductStatsCards'
export { ProductFilterBar } from './ProductFilterBar'
export { InventoryProductsTable } from './InventoryProductsTable'
export { ShopProductsTable } from './ShopProductsTable'
export { BulkImportModal } from './BulkImportModal'

// Legacy export for backwards compatibility (to be removed)
export { MedusaProductsTable } from './MedusaProductsTable'
