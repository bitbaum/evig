import Link from 'next/link'
import Image from 'next/image'
import { Package, Tag } from 'lucide-react'
import type { InventoryProduct } from '@/lib/services/inventory-service'
import { formatCHF } from '@/config/marketplace'
import { CO2Badge } from '@/components/marketplace/CO2Badge'

interface Props {
  product: InventoryProduct
  stockOneLabel?: string
}

export function ProductCard({ product, stockOneLabel }: Props) {
  return (
    <Link
      href={`/shop/product/${product.item_uuid}`}
      className="group card-shell hover:border-strong transition-all overflow-hidden flex flex-col"
    >
      <div className="relative aspect-4/3 bg-surface-raised">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-12 h-12 text-text-muted" />
          </div>
        )}
        {stockOneLabel && product.quantity <= 1 && (
          <span className="absolute top-2 right-2 text-xs bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 font-medium px-2 py-0.5 rounded-full">
            {stockOneLabel}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{product.brand}</p>
          <h3 className="font-medium text-text-primary group-hover:text-action transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </div>
        {product.description && (
          <p className="text-sm text-text-tertiary line-clamp-2">{product.description}</p>
        )}
        {/* CO₂ Badge — silently hides when category isn't a known KATEGORIEN
            ID (shop inventory categories are sometimes free text from CSV
            imports). Credibility-first: better empty than guessed. */}
        {product.category && (
          <CO2Badge category={product.category} className="text-xs" />
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-action" />
            <span className="font-bold text-action">{formatCHF(product.price)}</span>
          </div>
          <span className="text-xs bg-surface-raised text-text-secondary px-2 py-0.5 rounded-full capitalize">
            {product.condition}
          </span>
        </div>
      </div>
    </Link>
  )
}
