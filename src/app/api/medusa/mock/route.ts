/**
 * Mock Medusa API for development
 * Provides basic product and cart functionality
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiNotFound } from '@/lib/api/helpers'

// Mock products data
const mockProducts = [
  {
    id: 'prod_1',
    title: 'Refurbished MacBook Pro 14"',
    description: 'Professionell aufgearbeitetes MacBook Pro mit M1 Pro Chip',
    handle: 'macbook-pro-14',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
    variants: [{
      id: 'variant_1',
      title: 'MacBook Pro 14" M1 Pro',
      prices: [{ amount: 129900, currency_code: 'chf' }],
      inventory_quantity: 5
    }],
    images: [
      { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800' },
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' }
    ],
    collection: { title: 'Laptops' }
  },
  {
    id: 'prod_2',
    title: 'Gaming Desktop PC',
    description: 'Leistungsstarker Gaming-PC mit RTX 4070',
    handle: 'gaming-desktop-pc',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
    variants: [{
      id: 'variant_2',
      title: 'Gaming PC RTX 4070',
      prices: [{ amount: 189900, currency_code: 'chf' }],
      inventory_quantity: 3
    }],
    images: [
      { url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800' }
    ],
    collection: { title: 'Desktop PCs' }
  },
  {
    id: 'prod_3',
    title: '27" 4K Monitor',
    description: 'Professioneller 4K Monitor für kreative Arbeit',
    handle: '4k-monitor-27',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    variants: [{
      id: 'variant_3',
      title: '27" 4K Monitor',
      prices: [{ amount: 49900, currency_code: 'chf' }],
      inventory_quantity: 8
    }],
    images: [
      { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800' }
    ],
    collection: { title: 'Monitore' }
  }
]

// Mock collections
const mockCollections = [
  { id: 'col_1', title: 'Laptops', handle: 'laptops' },
  { id: 'col_2', title: 'Desktop PCs', handle: 'desktop-pcs' },
  { id: 'col_3', title: 'Monitore', handle: 'monitore' },
  { id: 'col_4', title: 'Zubehör', handle: 'zubehoer' }
]

interface MockCart {
  id: string;
  items: Array<{
    id: string;
    title: string;
    thumbnail: string;
    unit_price: number;
    quantity: number;
    total: number;
  }>;
  total: number;
  subtotal: number;
  tax_total: number;
}

// Simple in-memory cart storage (for demo only)
let mockCarts: Record<string, MockCart> = {}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  switch (path) {
    case 'store/product':
      return apiSuccess({
        products: mockProducts,
        count: mockProducts.length
      })

    case 'store/collection':
      return apiSuccess({
        collections: mockCollections
      })

    default:
      return apiNotFound('Endpoint')
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const body = await request.json()

  switch (path) {
    case 'store/cart':
      // Create cart
      const cartId = `cart_${Date.now()}`
      const cart = {
        id: cartId,
        items: [],
        total: 0,
        subtotal: 0,
        tax_total: 0
      }
      mockCarts[cartId] = cart
      return apiSuccess({ cart })

    case 'store/cart/line-item':
      // Add item to cart
      const { cart_id, variant_id, quantity = 1 } = body
      const existingCart = mockCarts[cart_id]

      if (!existingCart) {
        return apiNotFound('Cart')
      }

      const product = mockProducts.find(p => p.variants.some(v => v.id === variant_id))
      const variant = product?.variants.find(v => v.id === variant_id)

      if (!product || !variant) {
        return apiNotFound('Variant')
      }

      const lineItem = {
        id: `item_${Date.now()}`,
        title: product.title,
        thumbnail: product.thumbnail,
        unit_price: variant.prices[0].amount,
        quantity,
        total: variant.prices[0].amount * quantity
      }

      existingCart.items.push(lineItem)
      existingCart.total = existingCart.items.reduce((sum, item) => sum + item.total, 0)
      existingCart.subtotal = existingCart.total

      return apiSuccess({ cart: existingCart })

    default:
      return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (path?.startsWith('store/cart/line-item/')) {
    const cartId = searchParams.get('cart_id')
    const lineId = path.split('/').pop()

    if (!cartId || !mockCarts[cartId]) {
      return apiNotFound('Cart')
    }

    const cart = mockCarts[cartId]
    cart.items = cart.items.filter((item) => item.id !== lineId)
    cart.total = cart.items.reduce((sum, item) => sum + item.total, 0)
    cart.subtotal = cart.total

    return apiSuccess({ cart })
  }

  return apiNotFound('Endpoint')
}






