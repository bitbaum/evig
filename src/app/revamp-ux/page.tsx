/**
 * Refactored Revamp-UX Page
 * @fileoverview Modular, maintainable version of the original god component
 *
 * Improvements:
 * - Separated components into reusable modules
 * - Extracted data from logic
 * - Improved TypeScript types
 * - Better separation of concerns
 * - Reduced file size from 1036 to ~75 lines
 */

'use client'

import { useState } from 'react'
import { 
  HeroSection, 
  FeatureModal, 
  FEATURE_DETAILS, 
  ProblemStatement,
  HowItWorks,
  KeyBenefits,
  ComparisonTable,
  AccessControl,
  DevelopmentRoadmap,
  CallToAction,
  type FeatureKey 
} from '@/components/revamp-ux'

export default function RevampUXPageRefactored() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey | null>(null)

  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature)
  }

  const handleClosePanel = () => {
    setSelectedFeature(null)
  }

  return (
    <div className="bg-white">
      {/* Feature Detail Modal */}
      <FeatureModal
        selectedFeature={selectedFeature}
        featureDetails={FEATURE_DETAILS}
        onClose={handleClosePanel}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Statement */}
      <ProblemStatement />

      {/* How It Works */}
      <HowItWorks />

      {/* Features */}
      <KeyBenefits />

      {/* Feature Comparison */}
      <ComparisonTable />

      {/* Access Control */}
      <AccessControl />

      {/* System Development Status */}
      <DevelopmentRoadmap />

      {/* Call to Action */}
      <CallToAction />
    </div>
  )
}
