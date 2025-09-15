/**
 * Hero Section Component
 * @fileoverview Main hero section for the Revamp-UX page
 */

import React from 'react'
import { Brain, Sparkles } from 'lucide-react'
import { HeroSectionProps } from './types'

export function HeroSection({
  title = "Revamp-UX System",
  subtitle = "Das integrierte Feedback- und Content-Management-System. Nutzer geben kontextuelles Feedback, Entwickler erhalten strukturierte Informationen für schnelle Verbesserungen.",
  isDevelopment = true
}: HeroSectionProps) {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-4xl py-24 sm:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              {title}
            </span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {isDevelopment && (
            <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <p className="text-sm font-medium text-gray-900 mb-2">🔧 In Entwicklung</p>
              <p className="text-sm text-gray-600">
                Dieses System wird entwickelt, um Website-Verbesserungen zu vereinfachen. Hier sehen Sie das Konzept.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}