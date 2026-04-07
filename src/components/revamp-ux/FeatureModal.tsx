/**
 * Feature Modal Component
 * @fileoverview Modal for displaying feature comparison details
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { FeatureModalProps } from './types'

export function FeatureModal({ selectedFeature, featureDetails, onClose }: FeatureModalProps) {
  if (!selectedFeature) return null

  const feature = featureDetails[selectedFeature]

  return (
    <>
      {/* Clickable Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div role="dialog" aria-modal="true" aria-labelledby="feature-modal-title" className="fixed top-0 left-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 ease-in-out">
        {/* Close Arrow Button */}
        <Button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-full shadow-lg z-10"
          aria-label="Panel schliessen"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>

        {/* Panel Content */}
        <div className="h-full overflow-y-auto pt-20 pb-6">
          <div className="px-6">
            <h3 id="feature-modal-title" className="text-xl font-bold text-gray-900 mb-6">{selectedFeature}</h3>
            <div className="space-y-4">
              <ComparisonCard
                title="WordPress"
                content={feature.wordpress}
                borderColor="border-orange-500"
                titleColor="text-orange-600"
              />
              <ComparisonCard
                title="Strapi"
                content={feature.strapi}
                borderColor="border-red-500"
                titleColor="text-red-600"
              />
              <ComparisonCard
                title="Contentful"
                content={feature.contentful}
                borderColor="border-orange-500"
                titleColor="text-orange-600"
              />
              <ComparisonCard
                title="Revamp-UX"
                content={feature.revamp}
                borderColor="border-green-500"
                titleColor="text-green-600"
                highlighted
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface ComparisonCardProps {
  title: string
  content: string
  borderColor: string
  titleColor: string
  highlighted?: boolean
}

function ComparisonCard({ title, content, borderColor, titleColor, highlighted }: ComparisonCardProps) {
  return (
    <div className={`border-l-4 ${borderColor} pl-4 ${highlighted ? 'bg-green-50 p-4 rounded' : ''}`}>
      <h4 className={`font-semibold ${titleColor} mb-2`}>{title}</h4>
      <p className="text-gray-600 text-sm">{content}</p>
    </div>
  )
}