/**
 * Product management components
 *
 * Extracted from the original ProductManagement.tsx god component.
 * Following DRY and separation of concerns principles.
 */

export * from './types'
export { ProductTabSwitcher } from './ProductTabSwitcher'
export { ProductStatsCards } from './ProductStatsCards'
export { ProductFilterBar } from './ProductFilterBar'
export { InventoryProductsTable } from './InventoryProductsTable'
export { ShopProductsTable } from './ShopProductsTable'
export { BulkImportModal } from './BulkImportModal'
export { ProductConfirmDialogs } from './ProductConfirmDialogs'
export { useProductActions } from './useProductActions'
export { useProductConfirmActions } from './useProductConfirmActions'
