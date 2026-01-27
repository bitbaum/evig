'use client'

import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Fehler beim Laden der Produkte
        </h3>
        <p className="text-gray-600 mb-4">
          {message || 'Bitte versuchen Sie es später erneut.'}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
