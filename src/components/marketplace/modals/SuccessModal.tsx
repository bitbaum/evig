/**
 * SuccessModal Component
 * 
 * Modal shown after successful product listing
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Package, Eye, TrendingUp, DollarSign, Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getTextColor, getStatusColors } from '@/lib/design-system'

interface ListedProduct {
  id: string
  title: string
  price: string
  brand?: string
  condition?: string
  images?: string[]
  createdAt: string
  views?: number
}

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  product: ListedProduct | null
  onResetForm: () => void
}

export function SuccessModal({ isOpen, onClose, product, onResetForm }: SuccessModalProps) {
  if (!product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-success-600 to-success-700 text-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Produkt erfolgreich aufgelistet! 🎉</h2>
                  <p className="text-success-100 mt-1">
                    Ihr {product.title} ist jetzt live im RevampIT Marketplace
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Product Preview */}
              <div className="bg-neutral-50 rounded-lg p-4 mb-6 border border-neutral-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn('font-semibold', getTextColor('white', 'primary'))}>
                      {product.title}
                    </h3>
                    <p className={cn('text-sm', getTextColor('white', 'muted'))}>
                      CHF {product.price} {product.brand && `• ${product.brand}`} {product.condition && `• ${product.condition}`}
                    </p>
                    <p className={cn('text-xs mt-1', getTextColor('white', 'muted'))}>
                      Aufgelistet am {new Date(product.createdAt).toLocaleDateString('de-CH')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-info-50 rounded-lg border border-info-200">
                  <Eye className="w-6 h-6 text-info-600 mx-auto mb-1" />
                  <div className={cn('text-lg font-bold', getStatusColors('info').text)}>
                    {product.views || 0}
                  </div>
                  <div className={cn('text-xs', getStatusColors('info').text)}>Aufrufe</div>
                </div>
                <div className="text-center p-3 bg-success-50 rounded-lg border border-success-200">
                  <TrendingUp className="w-6 h-6 text-success-600 mx-auto mb-1" />
                  <div className={cn('text-lg font-bold', getStatusColors('success').text)}>0</div>
                  <div className={cn('text-xs', getStatusColors('success').text)}>Anfragen</div>
                </div>
                <div className="text-center p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                  <DollarSign className="w-6 h-6 text-secondary-600 mx-auto mb-1" />
                  <div className={cn('text-lg font-bold', 'text-secondary-900')}>CHF {product.price}</div>
                  <div className={cn('text-xs', 'text-secondary-700')}>Preis</div>
                </div>
              </div>

              {/* What happens next */}
              <div className="mb-6">
                <h4 className={cn('font-semibold mb-3', getTextColor('white', 'primary'))}>
                  Was passiert als nächstes?
                </h4>
                <div className="space-y-2 text-sm">
                  {[
                    'Ihr Produkt ist sofort sichtbar im Marketplace',
                    'Potenzielle Käufer können Sie direkt kontaktieren',
                    'Sie erhalten Benachrichtigungen bei Anfragen',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                      <span className={getTextColor('white', 'muted')}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className={cn('font-semibold', getTextColor('white', 'primary'))}>
                  Was möchten Sie als nächstes tun?
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onResetForm()
                      onClose()
                    }}
                    className="flex items-center gap-3 p-4 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors min-h-[touch] touch-target"
                  >
                    <Plus className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Weiteres Produkt auflisten</div>
                      <div className="text-sm opacity-90">Sofort neues Produkt hinzufügen</div>
                    </div>
                  </button>

                  <Link
                    href="/marketplace"
                    className="flex items-center gap-3 p-4 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors min-h-[touch] touch-target"
                  >
                    <Eye className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Im Marketplace ansehen</div>
                      <div className="text-sm opacity-90">Ihr Produkt live erleben</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/seller/products"
                    className="flex items-center gap-3 p-4 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors min-h-[touch] touch-target"
                  >
                    <Package className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Meine Produkte verwalten</div>
                      <div className="text-sm opacity-90">Alle Ihre Listings bearbeiten</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/seller"
                    className="flex items-center gap-3 p-4 bg-warning-500 text-white rounded-lg hover:bg-warning-600 transition-colors min-h-[touch] touch-target"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Verkaufsstatistiken</div>
                      <div className="text-sm opacity-90">Performance analysieren</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 p-4 bg-neutral-50">
              <button
                onClick={onClose}
                className="w-full text-neutral-600 hover:text-neutral-800 transition-colors min-h-[touch] touch-target"
              >
                Schliessen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



