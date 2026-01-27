'use client'

import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-3 text-gray-600">Produkte werden geladen...</span>
      </div>
    </div>
  )
}
