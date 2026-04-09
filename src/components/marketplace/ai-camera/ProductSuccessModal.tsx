"use client"

/**
 * Success modal shown after product is selected
 */

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { ProductSuggestion } from './types'
import Heading from '@/components/ui/Heading'

interface ProductSuccessModalProps {
  suggestion: ProductSuggestion
  onClose: () => void
}

export function ProductSuccessModal({ suggestion, onClose }: ProductSuccessModalProps) {
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
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <Heading level={2} className="text-2xl font-bold text-gray-900 mb-2">
          Produkt erkannt!
        </Heading>
        <p className="text-gray-600 mb-6">
          {suggestion.name} wurde erfolgreich identifiziert und das Formular ausgefüllt.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            {IconComponent ? (
              <IconComponent className="w-6 h-6 text-blue-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-blue-600" />
            )}
            <span className="font-medium text-gray-900">{suggestion.name}</span>
          </div>
          <p className="text-sm text-gray-600">CHF {suggestion.estimatedPrice}</p>
          <p className="text-xs text-green-600 mt-1">
            {Math.round(suggestion.confidence * 100)}% Übereinstimmung
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Formular bearbeiten
        </button>
      </motion.div>
    </motion.div>
  )
}
