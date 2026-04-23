/**
 * AISearchModal Component
 * 
 * Modal for AI-powered product search
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, CheckCircle, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { getTextColor, getStatusColors } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

interface SearchResult {
  id: string
  name: string
  brand: string
  category: string
  estimatedPrice: number
  confidence: number
  features: string[]
  condition: string
}

interface AISearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: () => void
  isSearching: boolean
  searchResults: SearchResult[]
  onSelectResult: (result: SearchResult) => void
}

export function AISearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching,
  searchResults,
  onSelectResult,
}: AISearchModalProps) {
  const t = useTranslations('components.aiSearchModal')
  const searchExamples = [
    'iPhone 13 Pro Max',
    'MacBook Air M1',
    'Dell Latitude E7470',
    'Samsung Galaxy S21',
    t('articleNumberExample'),
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-info-600" />
                  </div>
                  <div>
                    <Heading level={2} className={cn('text-xl font-semibold', getTextColor('white', 'primary'))}>
                      {t('title')}
                    </Heading>
                    <p className={cn('text-sm', getTextColor('white', 'muted'))}>
                      {t('subtitle')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors min-h-[touch] touch-target p-2"
                  aria-label={t('close')}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Search Input */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                      placeholder={t('searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-info-500 text-base"
                    />
                  </div>
                  <button
                    onClick={onSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[touch] touch-target"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {t('search')}
                  </button>
                </div>

                {/* Search Examples */}
                <div className="mt-4 p-4 bg-info-50 rounded-lg border border-info-200">
                  <p className={cn('text-sm font-medium mb-2', getStatusColors('info').text)}>
                    {t('examples')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchExamples.map((example) => (
                      <button
                        key={example}
                        onClick={() => onSearchQueryChange(example)}
                        className="px-3 py-1 bg-info-100 text-info-700 rounded-full text-xs hover:bg-info-200 transition-colors min-h-[touch] touch-target"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <Heading level={3} className={cn('text-lg font-medium', getTextColor('white', 'primary'))}>
                    {t('resultsFound', { count: searchResults.length })}
                  </Heading>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => {
                      const confidenceColors = 
                        result.confidence > 0.8 ? getStatusColors('success') :
                        result.confidence > 0.6 ? getStatusColors('warning') :
                        getStatusColors('error')

                      return (
                        <div
                          key={result.id}
                          onClick={() => onSelectResult(result)}
                          className="p-4 border-2 border-neutral-200 rounded-lg hover:border-info-300 hover:bg-info-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-info-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Heading level={4} className={cn('text-sm font-medium', getTextColor('white', 'primary'))}>
                                  {result.name}
                                </Heading>
                                <span className={cn(
                                  "px-2 py-1 text-xs rounded-full",
                                  confidenceColors.bg,
                                  confidenceColors.text
                                )}>
                                  {t('confidence', { percent: Math.round(result.confidence * 100) })}
                                </span>
                              </div>
                              <p className={cn('text-sm mb-2', getTextColor('white', 'muted'))}>
                                {result.brand} • {result.category} • CHF {result.estimatedPrice}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {result.features.slice(0, 3).map((feature, index) => (
                                  <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-info-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => {
                        onSearchQueryChange('')
                        // Clear results handled by parent
                      }}
                      className="flex-1 px-4 py-2 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors min-h-[touch] touch-target"
                    >
                      {t('newSearch')}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors min-h-[touch] touch-target"
                    >
                      {t('manualEntry')}
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-info-600 animate-spin mx-auto mb-4" />
                  <Heading level={3} className={cn('text-lg font-medium mb-2', getTextColor('white', 'primary'))}>
                    {t('searching')}
                  </Heading>
                  <p className={cn('text-sm', getTextColor('white', 'muted'))}>
                    {t('searchingDesc')}
                  </p>
                </div>
              )}

              {/* No Results State */}
              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <Heading level={3} className={cn('text-lg font-medium mb-2', getTextColor('white', 'primary'))}>
                    {t('noResults')}
                  </Heading>
                  <p className={cn('text-sm mb-4', getTextColor('white', 'muted'))}>
                    {t('noResultsDesc', { query: searchQuery })}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => onSearchQueryChange('')}
                      className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors min-h-[touch] touch-target"
                    >
                      {t('newSearch')}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors min-h-[touch] touch-target"
                    >
                      {t('manualEntry')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



