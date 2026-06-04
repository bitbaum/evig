"use client"

/**
 * Success modal shown after product is selected
 */

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ProductSuggestion } from './types'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface ProductSuccessModalProps {
  suggestion: ProductSuggestion
  onClose: () => void
}

export function ProductSuccessModal({ suggestion, onClose }: ProductSuccessModalProps) {
  const t = useTranslations('components.productSuccessModal')
  const IconComponent = suggestion.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white dark:border dark:border-white/6 rounded-xl shadow-xl max-w-md w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
        <Heading level={2} className="text-2xl font-bold text-text-primary mb-2">
          {t('title')}
        </Heading>
        <p className="text-text-secondary mb-6">
          {t('identified', { name: suggestion.name })}
        </p>
        <div className="bg-surface-raised rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            {IconComponent ? (
              <IconComponent className="w-6 h-6 text-action" />
            ) : (
              <CheckCircle className="w-6 h-6 text-action" />
            )}
            <span className="font-medium text-text-primary">{suggestion.name}</span>
          </div>
          <p className="text-sm text-text-secondary">CHF {suggestion.estimatedPrice}</p>
          <p className="text-xs text-action mt-1">
            {t('confidence', { percent: Math.round(suggestion.confidence * 100) })}
          </p>
        </div>
        <Button onClick={onClose} variant="primary" className="w-full">
          {t('editForm')}
        </Button>
      </motion.div>
    </motion.div>
  )
}
