export { default as ProductManagement } from './ProductManagement'
export * from './types'
export * from './hooks/useInventoryProducts'
// Re-export components explicitly to avoid naming conflicts with types
export {
  InventoryStats,
  MedusaStats,
  ProductFilters,
  InventoryProductTable,
  MedusaProductTable,
  BulkImportModal,
  TabSwitcher,
  LoadingState,
  ErrorState,
} from './components'
