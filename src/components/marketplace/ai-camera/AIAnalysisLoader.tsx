"use client"

/**
 * Loading state during AI analysis
 */

import { Loader2 } from 'lucide-react'

export function AIAnalysisLoader() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Produkt wird analysiert...
      </h3>
      <p className="text-gray-600">
        Unsere KI erkennt Marke, Modell und Zustand deines Produkts
      </p>
      <div className="mt-6 bg-gray-200 rounded-full h-2">
        <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  )
}
