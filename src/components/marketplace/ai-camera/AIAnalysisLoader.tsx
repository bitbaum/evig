"use client"

/**
 * Loading state during AI analysis
 */

import { Loader2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'

export function AIAnalysisLoader() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
      <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">
        Produkt wird analysiert...
      </Heading>
      <p className="text-neutral-600">
        Unsere KI erkennt Marke, Modell und Zustand deines Produkts
      </p>
      <div className="mt-6 bg-neutral-200 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  )
}
