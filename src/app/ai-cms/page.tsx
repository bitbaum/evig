import { Metadata } from 'next'
import { HeroSection } from './sections/HeroSection'
import { ProblemSection } from './sections/ProblemSection'
import { WorkflowSection } from './sections/WorkflowSection'
import { AccessControlSection } from './sections/AccessControlSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { SuggestionTypesSection } from './sections/SuggestionTypesSection'
import { ComparisonSection } from './sections/ComparisonSection'
import { StatusSection } from './sections/StatusSection'
import { CTASection } from './sections/CTASection'

export const metadata: Metadata = {
  title: 'Kontextuelle Website-Verbesserungen',
  description: 'Unser Verbesserungssystem ermöglicht es Nutzern, direkt auf jeder Seite Feedback zu geben. Eine moderne Alternative zu herkömmlichen Content-Management-Systemen.',
  keywords: ['Website Feedback', 'Content Management', 'User Feedback', 'Website Verbesserung', 'Community-driven Development'],
}

export default function AICMSPage() {
  return (
    <div className="bg-surface-base">
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <AccessControlSection />
      <FeaturesSection />
      <SuggestionTypesSection />
      <ComparisonSection />
      <StatusSection />
      <CTASection />
    </div>
  )
}
