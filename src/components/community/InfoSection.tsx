/**
 * InfoSection Component
 *
 * Reusable component for displaying list sections with checkmark bullets.
 * Used across all get-involved pages for features, requirements, etc.
 */

import { responsiveTypography, responsiveSpacing } from '@/lib/responsive'
import { ListItem } from '@/config/community'
import Heading from '@/components/ui/Heading'

interface InfoSectionProps {
  title: string
  items: ListItem[]
  description?: string
  className?: string
}

export function InfoSection({ title, items, description, className = '' }: InfoSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <Heading level={2} className={`${responsiveTypography.section} font-bold text-neutral-900`}>
        {title}
      </Heading>
      {description && (
        <p className={`${responsiveTypography.lead} text-neutral-600 leading-relaxed ${responsiveSpacing.mbMedium}`}>
          {description}
        </p>
      )}
      <div className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} border border-neutral-200`}>
        <ul className={`space-y-${description ? '4' : '4'}`}>
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary-600 mr-3">•</span>
              <span className={`${responsiveTypography.body} text-neutral-600`}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * NumberedSteps Component
 *
 * Reusable component for displaying step-by-step processes.
 * Used for "How to Get Started" sections across pages.
 */

interface NumberedStepsProps {
  title: string
  steps: ListItem[]
  className?: string
}

export function NumberedSteps({ title, steps, className = '' }: NumberedStepsProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <Heading level={2} className={`${responsiveTypography.section} font-bold text-neutral-900`}>
        {title}
      </Heading>
      <div className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} border border-neutral-200`}>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary-600 font-semibold mr-3">{index + 1}.</span>
              <span className={`${responsiveTypography.body} text-neutral-600`}>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Callout Component
 *
 * Reusable component for highlighted callout boxes.
 * Used for important messages, notes, and highlighted content.
 */

interface CalloutProps {
  title: string
  content: string
  className?: string
}

export function Callout({ title, content, className = '' }: CalloutProps) {
  return (
    <section className={`bg-primary-50 rounded-xl ${responsiveSpacing.cardPadding} space-y-4 ${className}`}>
      <Heading level={3} className={`${responsiveTypography.cardTitle} font-semibold text-neutral-900`}>
        {title}
      </Heading>
      <p className={`${responsiveTypography.body} text-neutral-600 leading-relaxed`}>
        {content}
      </p>
    </section>
  )
}
