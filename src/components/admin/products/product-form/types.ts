export interface ProductVariant {
  title: string
  sku: string
  price: string
  inventory: string
}

export interface ProductFormData {
  title: string
  handle: string
  description: string
  price: string
  comparePrice: string
  cost: string
  sku: string
  barcode: string
  inventory: string
  category: string
  tags: string[]
  images: File[]
  variants: ProductVariant[]
}

export const INITIAL_PRODUCT_FORM_DATA: ProductFormData = {
  title: '',
  handle: '',
  description: '',
  price: '',
  comparePrice: '',
  cost: '',
  sku: '',
  barcode: '',
  inventory: '0',
  category: '',
  tags: [],
  images: [],
  variants: [{
    title: 'Default Variant',
    sku: '',
    price: '',
    inventory: '0',
  }],
}

export interface SmartEntryState {
  query: string
  isLoading: boolean
  error: string | null
  success: string | null
}

export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Desktop PCs',
  'Monitore',
  'Zubehör',
  'Server',
  'Netzwerk',
  'Software',
]
